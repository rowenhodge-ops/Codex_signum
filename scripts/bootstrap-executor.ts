// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Bootstrap ModelExecutor — calls LLMs directly for self-hosting.
 * Uses Thompson routing from core, direct API calls for execution.
 *
 * NOT part of the npm package. Dev tooling only.
 */
import { selectModel } from "../src/patterns/thompson-router/select-model.js";
import type {
  ModelExecutor,
  ModelExecutorContext,
  ModelExecutorResult,
} from "../src/patterns/architect/types.js";
import { getVertexToken, GCP_PROJECT, VERTEX_REGION } from "./vertex-auth.js";

// ── Provider dispatch ─────────────────────────────────────────────────────

interface ProviderCallResult {
  text: string;
  durationMs: number;
}

const HEARTBEAT_INTERVAL_MS = 15_000;

// ── Anthropic SSE stream parser ──────────────────────────────────────────

async function parseAnthropicStream(
  response: Response,
  modelId: string,
): Promise<{ text: string; thinkingDurationMs: number }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let textContent = "";
  let buffer = "";
  let thinkingStarted = 0;
  let thinkingDurationMs = 0;
  let lastHeartbeat = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events (double newline separated)
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? ""; // Keep incomplete event in buffer

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (!dataLine) continue;

      const dataStr = dataLine.slice(6);
      if (dataStr === "[DONE]") continue;

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(dataStr);
      } catch {
        continue; // Skip unparseable chunks
      }

      switch (data.type) {
        case "content_block_start": {
          const block = data.content_block as
            | { type: string }
            | undefined;
          if (block?.type === "thinking") {
            thinkingStarted = Date.now();
            console.log(`  [${modelId}] thinking started...`);
          }
          break;
        }

        case "content_block_delta": {
          const delta = data.delta as
            | { type: string; thinking?: string; text?: string }
            | undefined;
          if (delta?.type === "thinking_delta") {
            // Heartbeat during extended thinking
            const now = Date.now();
            if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
              const elapsed = ((now - thinkingStarted) / 1000).toFixed(0);
              console.log(
                `  [${modelId}] still thinking... ${elapsed}s elapsed`,
              );
              lastHeartbeat = now;
            }
          } else if (delta?.type === "text_delta" && delta.text) {
            textContent += delta.text;
          }
          break;
        }

        case "content_block_stop":
          if (thinkingStarted > 0 && thinkingDurationMs === 0) {
            thinkingDurationMs = Date.now() - thinkingStarted;
            console.log(
              `  [${modelId}] thinking complete (${(thinkingDurationMs / 1000).toFixed(1)}s)`,
            );
          }
          break;

        case "error":
          throw new Error(
            `Anthropic stream error: ${JSON.stringify(data)}`,
          );

        default:
          // message_start, message_delta, message_stop, ping — ignore
          break;
      }
    }
  }

  return { text: textContent, thinkingDurationMs };
}

// ── Anthropic non-streaming fallback ─────────────────────────────────────

async function callAnthropicNonStreaming(
  apiModelString: string,
  requestBody: Record<string, unknown>,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  // Remove stream flag for fallback
  const body = { ...requestBody, stream: false };
  delete body.stream;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");
}

// ── Anthropic call (streaming with fallback) ─────────────────────────────

async function callAnthropic(
  apiModelString: string,
  thinkingMode: string,
  thinkingParameter: string | undefined,
  prompt: string,
): Promise<ProviderCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const messages = [{ role: "user" as const, content: prompt }];

  const requestBody: Record<string, unknown> = {
    model: apiModelString,
    max_tokens: 16384,
    messages,
    stream: true,
  };

  // Adaptive thinking (4.6 models) — no budget_tokens, just type: "adaptive"
  if (thinkingMode === "adaptive") {
    requestBody.thinking = { type: "adaptive" };
  } else if (thinkingMode === "extended" && thinkingParameter) {
    // Extended thinking (older models) — requires budget_tokens
    // max_tokens MUST be greater than budget_tokens
    const budget = parseBudget(thinkingParameter);
    requestBody.thinking = {
      type: "enabled",
      budget_tokens: budget,
    };
    requestBody.max_tokens = budget + 16384;
  }

  const start = Date.now();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText}`);
  }

  // Try streaming parse, fall back to non-streaming on error
  try {
    const { text, thinkingDurationMs } = await parseAnthropicStream(
      response,
      apiModelString,
    );
    if (!text) {
      throw new Error(
        `Empty text response from ${apiModelString} (thinking took ${thinkingDurationMs}ms)`,
      );
    }
    return { text, durationMs: Date.now() - start };
  } catch (streamErr) {
    console.warn(
      `  [${apiModelString}] streaming parse failed, retrying non-streaming: ${streamErr}`,
    );
    const text = await callAnthropicNonStreaming(
      apiModelString,
      requestBody,
    );
    return { text, durationMs: Date.now() - start };
  }
}

// ── Google stream parser ──────────────────────────────────────────────────

async function parseGoogleStream(
  response: Response,
  modelId: string,
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let textContent = "";
  let buffer = "";
  let lastHeartbeat = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Google streams newline-delimited JSON (array chunks)
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      let trimmed = line.trim();
      if (!trimmed || trimmed === "[" || trimmed === "]" || trimmed === ",")
        continue;

      try {
        // Strip SSE "data: " prefix (alt=sse format)
        if (trimmed.startsWith("data: ")) trimmed = trimmed.slice(6);
        if (trimmed === "[DONE]") continue;
        // Strip leading comma if present (array format)
        const clean = trimmed.startsWith(",") ? trimmed.slice(1) : trimmed;
        const chunk = JSON.parse(clean) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const parts = chunk.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.text) {
            textContent += part.text;
          }
        }

        // Heartbeat
        const now = Date.now();
        if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
          console.log(
            `  [${modelId}] streaming... ${textContent.length} chars received`,
          );
          lastHeartbeat = now;
        }
      } catch {
        // Partial JSON — will complete in next chunk
      }
    }
  }

  return textContent;
}

// ── Google call (streaming with fallback) ─────────────────────────────────

async function callGoogle(
  apiModelString: string,
  prompt: string,
): Promise<ProviderCallResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 16384 },
  };

  // Try streaming first
  const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModelString}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const start = Date.now();

  try {
    const response = await fetch(streamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API ${response.status}: ${errText}`);
    }

    const text = await parseGoogleStream(response, apiModelString);
    if (!text) {
      throw new Error("Streaming returned 0 chars — falling back to non-streaming");
    }
    return { text, durationMs: Date.now() - start };
  } catch (streamErr) {
    // Fall back to non-streaming
    console.warn(
      `  [${apiModelString}] streaming failed, retrying non-streaming: ${streamErr}`,
    );
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModelString}:generateContent?key=${apiKey}`;
    const response = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("\n") ?? "";

    return { text, durationMs: Date.now() - start };
  }
}

// ── Vertex AI Gemini (streaming with fallback) ───────────────────────────

async function callVertexGemini(
  apiModelString: string,
  prompt: string,
): Promise<ProviderCallResult> {
  const token = await getVertexToken();
  if (!token) {
    const err = new Error("[INFRASTRUCTURE] Vertex AI credentials not available");
    (err as any).isInfrastructure = true;
    throw err;
  }

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 16384 },
  };

  // Streaming: streamGenerateContent with alt=sse for single-line JSON events
  const streamUrl = `https://${VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${VERTEX_REGION}/publishers/google/models/${apiModelString}:streamGenerateContent?alt=sse`;

  const start = Date.now();

  try {
    const response = await fetch(streamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vertex Gemini API ${response.status}: ${errText}`);
    }

    const text = await parseGoogleStream(response, apiModelString);
    if (!text) {
      throw new Error("Streaming returned 0 chars — falling back to non-streaming");
    }
    return { text, durationMs: Date.now() - start };
  } catch (streamErr) {
    // Fall back to non-streaming generateContent
    console.warn(
      `  [${apiModelString}] Vertex streaming failed, retrying non-streaming: ${streamErr}`,
    );

    const refreshedToken = await getVertexToken();
    if (!refreshedToken) throw streamErr;

    const fallbackUrl = `https://${VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${VERTEX_REGION}/publishers/google/models/${apiModelString}:generateContent`;
    const response = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshedToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vertex Gemini API ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("\n") ?? "";

    return { text, durationMs: Date.now() - start };
  }
}

// ── Vertex AI Mistral / Codestral (rawPredict) ──────────────────────────

async function callVertexMistral(
  apiModelString: string,
  prompt: string,
): Promise<ProviderCallResult> {
  const token = await getVertexToken();
  if (!token) {
    const err = new Error("[INFRASTRUCTURE] Vertex AI credentials not available");
    (err as any).isInfrastructure = true;
    throw err;
  }

  const url = `https://${VERTEX_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${VERTEX_REGION}/publishers/mistralai/models/${apiModelString}:rawPredict`;

  const requestBody = {
    model: apiModelString,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 16384,
  };

  const start = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Vertex Mistral API ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";

  return { text, durationMs: Date.now() - start };
}

/**
 * Determine if a Vertex AI model uses rawPredict (Mistral/Codestral)
 * vs generateContent (Gemini). Based on model ID prefix.
 */
function isVertexMistralModel(apiModelString: string): boolean {
  const m = apiModelString.toLowerCase();
  return m.startsWith("mistral") || m.startsWith("codestral");
}

function parseBudget(param: string): number {
  const budgets: Record<string, number> = {
    max: 128000,
    high: 32000,
    medium: 16000,
    low: 8000,
    "32k": 32768,
    "16k": 16384,
    "8k": 8192,
    "4k": 4096,
  };
  return budgets[param] ?? 16384;
}

// ── Provider classification ──────────────────────────────────────────────

type ProviderClass = "anthropic" | "vertex" | "google" | "unsupported";

function classifyProvider(provider: string): ProviderClass {
  const p = provider.toLowerCase();
  if (p === "anthropic") return "anthropic";
  if (p.includes("vertex")) return "vertex";
  if (p.includes("google") || p.includes("gemini")) return "google";
  return "unsupported";
}

function getAvailableProviders(vertexAvailable: boolean): Set<ProviderClass> {
  const available = new Set<ProviderClass>();
  if (process.env.ANTHROPIC_API_KEY) available.add("anthropic");
  if (vertexAvailable) available.add("vertex");
  if (process.env.GOOGLE_API_KEY) available.add("google");
  return available;
}

// ── ModelExecutor implementation ──────────────────────────────────────────

const MAX_SELECTION_RETRIES = 10;

function mapContextToRequest(
  context?: ModelExecutorContext,
): { taskType: string; complexity: "trivial" | "moderate" | "complex" | "critical" } {
  const taskType = context?.taskType ?? "general";
  const complexityMap: Record<string, "trivial" | "moderate" | "complex" | "critical"> = {
    simple: "trivial",
    moderate: "moderate",
    complex: "complex",
  };
  const complexity = complexityMap[context?.complexity ?? "moderate"] ?? "moderate";
  return { taskType, complexity };
}

export function createBootstrapModelExecutor(
  options?: { vertexAvailable?: boolean },
): ModelExecutor {
  const vertexReady = options?.vertexAvailable ?? false;

  return {
    async execute(
      prompt: string,
      context?: ModelExecutorContext,
    ): Promise<ModelExecutorResult> {
      const { taskType, complexity } = mapContextToRequest(context);
      const availableProviders = getAvailableProviders(vertexReady);

      if (availableProviders.size === 0) {
        throw new Error(
          "No API keys set. Set at least one of: ANTHROPIC_API_KEY, GOOGLE_API_KEY",
        );
      }

      // Retry loop: if Thompson selects a model whose provider has no API key,
      // record failure and re-select up to MAX_SELECTION_RETRIES times.
      for (let attempt = 0; attempt < MAX_SELECTION_RETRIES; attempt++) {
        const selection = await selectModel({
          taskType,
          complexity,
          qualityRequirement: context?.qualityRequirement ?? 0.7,
          callerPatternId: "architect",
        });

        const providerClass = classifyProvider(selection.provider);

        console.log(
          `  [Thompson] Selected: ${selection.selectedAgentId} (${selection.provider} → ${providerClass}, confidence: ${selection.confidence.toFixed(2)}, exploratory: ${selection.wasExploratory})`,
        );

        if (providerClass === "unsupported") {
          console.warn(
            `  [Thompson] Unsupported provider ${selection.provider} — recording failure, retrying (${attempt + 1}/${MAX_SELECTION_RETRIES})`,
          );
          await selection.recordOutcome({
            success: false,
            qualityScore: 0.0,
            durationMs: 0,
            errorType: "no_provider",
            notes: `Unsupported provider ${selection.provider}`,
          });
          continue;
        }

        if (!availableProviders.has(providerClass)) {
          console.warn(
            `  [Thompson] No API key for ${providerClass} — recording failure, retrying (${attempt + 1}/${MAX_SELECTION_RETRIES})`,
          );
          await selection.recordOutcome({
            success: false,
            qualityScore: 0.0,
            durationMs: 0,
            errorType: "no_api_key",
            notes: `No API key for provider ${providerClass} (${selection.provider})`,
          });
          continue;
        }

        let result: ProviderCallResult;

        try {
          if (providerClass === "anthropic") {
            result = await callAnthropic(
              selection.apiModelString,
              selection.thinkingMode,
              selection.thinkingParameter,
              prompt,
            );
          } else if (providerClass === "vertex") {
            if (isVertexMistralModel(selection.apiModelString)) {
              result = await callVertexMistral(selection.apiModelString, prompt);
            } else {
              result = await callVertexGemini(selection.apiModelString, prompt);
            }
          } else if (providerClass === "google") {
            result = await callGoogle(selection.apiModelString, prompt);
          } else {
            throw new Error(`Unsupported provider ${selection.provider}`);
          }

          // Record success
          await selection.recordOutcome({
            success: true,
            qualityScore: 0.7,
            durationMs: result.durationMs,
          });

          return {
            text: result.text,
            modelId: selection.selectedAgentId,
            durationMs: result.durationMs,
            wasExploratory: selection.wasExploratory,
          };
        } catch (err) {
          // Record failure and continue to next retry instead of killing the task.
          // This handles model 404s, budget_tokens errors, and transient API failures.
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(
            `  [Thompson] API error for ${selection.selectedAgentId} — recording failure, retrying (${attempt + 1}/${MAX_SELECTION_RETRIES}): ${errMsg.slice(0, 200)}`,
          );
          await selection.recordOutcome({
            success: false,
            qualityScore: 0.0,
            durationMs: 0,
            errorType: "api_error",
            notes: errMsg,
          });
          continue;
        }
      }

      throw new Error(
        `All ${MAX_SELECTION_RETRIES} model selections failed. Available providers: [${[...availableProviders].join(", ")}]`,
      );
    },
  };
}
