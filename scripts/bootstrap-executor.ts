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

// ── Provider dispatch ─────────────────────────────────────────────────────

interface ProviderCallResult {
  text: string;
  durationMs: number;
}

async function callAnthropic(
  apiModelString: string,
  thinkingMode: string,
  thinkingParameter: string | undefined,
  prompt: string,
): Promise<ProviderCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const messages = [{ role: "user" as const, content: prompt }];

  const body: Record<string, unknown> = {
    model: apiModelString,
    max_tokens: 16384,
    messages,
  };

  // Adaptive thinking (4.6 models) — no budget_tokens, just type: "adaptive"
  if (thinkingMode === "adaptive") {
    body.thinking = { type: "adaptive" };
  } else if (thinkingMode === "extended" && thinkingParameter) {
    // Extended thinking (older models) — requires budget_tokens
    body.thinking = {
      type: "enabled",
      budget_tokens: parseBudget(thinkingParameter),
    };
  }

  const start = Date.now();
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
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");

  return { text, durationMs: Date.now() - start };
}

async function callGoogle(
  apiModelString: string,
  prompt: string,
): Promise<ProviderCallResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModelString}:generateContent?key=${apiKey}`;

  const start = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 16384 },
    }),
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

async function callOpenRouter(
  apiModelString: string,
  prompt: string,
): Promise<ProviderCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const start = Date.now();
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: apiModelString,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 16384,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";

  return { text, durationMs: Date.now() - start };
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

type ProviderClass = "anthropic" | "google" | "openrouter";

function classifyProvider(provider: string): ProviderClass {
  const p = provider.toLowerCase();
  if (p === "anthropic") return "anthropic";
  if (p.includes("vertex") || p.includes("google") || p.includes("gemini")) return "google";
  return "openrouter";
}

function getAvailableProviders(): Set<ProviderClass> {
  const available = new Set<ProviderClass>();
  if (process.env.ANTHROPIC_API_KEY) available.add("anthropic");
  if (process.env.GOOGLE_API_KEY) available.add("google");
  if (process.env.OPENROUTER_API_KEY) available.add("openrouter");
  return available;
}

// ── ModelExecutor implementation ──────────────────────────────────────────

const MAX_SELECTION_RETRIES = 3;

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

export function createBootstrapModelExecutor(): ModelExecutor {
  return {
    async execute(
      prompt: string,
      context?: ModelExecutorContext,
    ): Promise<ModelExecutorResult> {
      const { taskType, complexity } = mapContextToRequest(context);
      const availableProviders = getAvailableProviders();

      if (availableProviders.size === 0) {
        throw new Error(
          "No API keys set. Set at least one of: ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENROUTER_API_KEY",
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
          } else if (providerClass === "google") {
            result = await callGoogle(selection.apiModelString, prompt);
          } else {
            result = await callOpenRouter(selection.apiModelString, prompt);
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
          // Record failure
          await selection.recordOutcome({
            success: false,
            qualityScore: 0.0,
            durationMs: 0,
            errorType: "api_error",
            notes: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      }

      throw new Error(
        `All ${MAX_SELECTION_RETRIES} model selections had no API key. Available: [${[...availableProviders].join(", ")}]`,
      );
    },
  };
}
