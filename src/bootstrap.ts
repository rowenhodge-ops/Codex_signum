// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { pathToFileURL } from "node:url";
import {
  closeDriver,
  createAgent,
  createPattern,
  ensureContextCluster,
  getDecisionsForCluster,
  listActiveAgents,
  migrateSchema,
  recordDecision,
  recordDecisionOutcome,
  runQuery,
  seedConstitutionalRules,
} from "./graph/index.js";
import type { AgentProps, PatternProps } from "./graph/queries.js";

export const ALL_ARMS: AgentProps[] = [
  {
    id: "claude-opus-4-6:adaptive:max",
    name: "Claude Opus 4.6 (Adaptive Max)",
    provider: "anthropic",
    model: "claude-opus-4-6",
    baseModelId: "claude-opus-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "max",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 128000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 15000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: [
      "code_generation",
      "review",
      "planning",
      "strategic",
      "extended_thinking",
    ],
  },
  {
    id: "claude-opus-4-6:adaptive:high",
    name: "Claude Opus 4.6 (Adaptive High)",
    provider: "anthropic",
    model: "claude-opus-4-6",
    baseModelId: "claude-opus-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "high",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 128000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 12000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "planning", "strategic"],
  },
  {
    id: "claude-opus-4-6:adaptive:medium",
    name: "Claude Opus 4.6 (Adaptive Medium)",
    provider: "anthropic",
    model: "claude-opus-4-6",
    baseModelId: "claude-opus-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "medium",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 128000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 8000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "claude-opus-4-6:adaptive:low",
    name: "Claude Opus 4.6 (Adaptive Low)",
    provider: "anthropic",
    model: "claude-opus-4-6",
    baseModelId: "claude-opus-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "low",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 128000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 5000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "routine", "analytical"],
  },
  {
    id: "claude-sonnet-4-6:adaptive:high",
    name: "Claude Sonnet 4.6 (Adaptive High)",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    baseModelId: "claude-sonnet-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "high",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 8000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "claude-sonnet-4-6:adaptive:medium",
    name: "Claude Sonnet 4.6 (Adaptive Medium)",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    baseModelId: "claude-sonnet-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "medium",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 5000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "generative"],
  },
  {
    id: "claude-sonnet-4-6:adaptive:low",
    name: "Claude Sonnet 4.6 (Adaptive Low)",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    baseModelId: "claude-sonnet-4-6",
    thinkingMode: "adaptive",
    thinkingParameter: "low",
    supportsAdaptiveThinking: true,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 3000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "generative", "routine"],
  },
  {
    id: "claude-opus-4-5:extended:32k",
    name: "Claude Opus 4.5 (Extended 32k)",
    provider: "anthropic",
    model: "claude-opus-4-5",
    baseModelId: "claude-opus-4-5",
    thinkingMode: "extended",
    thinkingParameter: "32k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 20000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "planning", "strategic"],
  },
  {
    id: "claude-opus-4-5:extended:16k",
    name: "Claude Opus 4.5 (Extended 16k)",
    provider: "anthropic",
    model: "claude-opus-4-5",
    baseModelId: "claude-opus-4-5",
    thinkingMode: "extended",
    thinkingParameter: "16k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 15000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "claude-opus-4-5:extended:8k",
    name: "Claude Opus 4.5 (Extended 8k)",
    provider: "anthropic",
    model: "claude-opus-4-5",
    baseModelId: "claude-opus-4-5",
    thinkingMode: "extended",
    thinkingParameter: "8k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 10000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "analytical"],
  },
  {
    id: "claude-sonnet-4-5:extended:16k",
    name: "Claude Sonnet 4.5 (Extended 16k)",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    baseModelId: "claude-sonnet-4-5",
    thinkingMode: "extended",
    thinkingParameter: "16k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 10000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "claude-sonnet-4-5:extended:8k",
    name: "Claude Sonnet 4.5 (Extended 8k)",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    baseModelId: "claude-sonnet-4-5",
    thinkingMode: "extended",
    thinkingParameter: "8k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 7000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "generative"],
  },
  {
    id: "claude-haiku-4-5:extended:8k",
    name: "Claude Haiku 4.5 (Extended 8k)",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    baseModelId: "claude-haiku-4-5",
    thinkingMode: "extended",
    thinkingParameter: "8k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: false,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: false,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
    avgLatencyMs: 4000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "routine"],
  },
  {
    id: "claude-haiku-4-5:extended:4k",
    name: "Claude Haiku 4.5 (Extended 4k)",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    baseModelId: "claude-haiku-4-5",
    thinkingMode: "extended",
    thinkingParameter: "4k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: false,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: false,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
    avgLatencyMs: 3000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "routine"],
  },
  {
    id: "claude-haiku-4-5:none",
    name: "Claude Haiku 4.5 (Raw Speed)",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    baseModelId: "claude-haiku-4-5",
    thinkingMode: "none",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: false,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: false,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
    avgLatencyMs: 1500,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["routine", "fast_commands"],
  },
  {
    id: "claude-opus-4-1:extended:16k",
    name: "Claude Opus 4.1 (Extended 16k)",
    provider: "anthropic",
    model: "claude-opus-4-1-20250828",
    baseModelId: "claude-opus-4-1",
    thinkingMode: "extended",
    thinkingParameter: "16k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 15000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review", "planning"],
  },
  {
    id: "claude-opus-4:extended:16k",
    name: "Claude Opus 4 (Extended 16k)",
    provider: "anthropic",
    model: "claude-opus-4-20250514",
    baseModelId: "claude-opus-4",
    thinkingMode: "extended",
    thinkingParameter: "16k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    avgLatencyMs: 15000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "review"],
  },
  {
    id: "claude-sonnet-4:extended:8k",
    name: "Claude Sonnet 4 (Extended 8k)",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    baseModelId: "claude-sonnet-4",
    thinkingMode: "extended",
    thinkingParameter: "8k",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 6000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "generative"],
  },
  {
    id: "claude-sonnet-4:none",
    name: "Claude Sonnet 4 (Raw)",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    baseModelId: "claude-sonnet-4",
    thinkingMode: "none",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: true,
    supportsInterleavedThinking: true,
    supportsPrefilling: true,
    supportsStructuredOutputs: true,
    supportsWebSearch: true,
    supportsComputerUse: true,
    maxContextWindow: 200000,
    maxOutputTokens: 64000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 3000,
    status: "active",
    region: "direct",
    endpoint: "messages",
    capabilities: ["code_generation", "routine"],
  },
  {
    id: "gemini-2.5-flash:default",
    name: "Gemini 2.5 Flash",
    provider: "vertex-ai",
    model: "gemini-2.5-flash",
    baseModelId: "gemini-2.5-flash",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    avgLatencyMs: 2000,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "routine", "fast_commands"],
  },
  {
    id: "gemini-2.5-pro:default",
    name: "Gemini 2.5 Pro",
    provider: "vertex-ai",
    model: "gemini-2.5-pro",
    baseModelId: "gemini-2.5-pro",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    avgLatencyMs: 8000,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "gemini-2.0-flash:default",
    name: "Gemini 2.0 Flash",
    provider: "vertex-ai",
    model: "gemini-2.0-flash",
    baseModelId: "gemini-2.0-flash",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 8192,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    avgLatencyMs: 1500,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["routine", "fast_commands"],
  },
  {
    id: "gemini-2.0-flash-lite:default",
    name: "Gemini 2.0 Flash Lite",
    provider: "vertex-ai",
    model: "gemini-2.0-flash-lite",
    baseModelId: "gemini-2.0-flash-lite",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 8192,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    avgLatencyMs: 1000,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["routine", "fast_commands"],
  },
  {
    id: "gemini-1.5-flash:default",
    name: "Gemini 1.5 Flash (Retired)",
    provider: "vertex-ai",
    model: "gemini-1.5-flash",
    baseModelId: "gemini-1.5-flash",
    thinkingMode: "default",
    maxContextWindow: 1048576,
    maxOutputTokens: 8192,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    avgLatencyMs: 1200,
    status: "retired",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["routine"],
  },
  {
    id: "gemini-1.5-pro:default",
    name: "Gemini 1.5 Pro (Retired)",
    provider: "vertex-ai",
    model: "gemini-1.5-pro",
    baseModelId: "gemini-1.5-pro",
    thinkingMode: "default",
    maxContextWindow: 2097152,
    maxOutputTokens: 8192,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    avgLatencyMs: 6000,
    status: "retired",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "analytical"],
  },
  {
    id: "gemini-2.5-flash-preview-04-17:default",
    name: "Gemini 2.5 Flash Preview (Retired)",
    provider: "vertex-ai",
    model: "gemini-2.5-flash-preview-04-17",
    baseModelId: "gemini-2.5-flash-preview",
    thinkingMode: "default",
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    avgLatencyMs: 2000,
    status: "retired",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "routine"],
  },
  {
    id: "gemini-3-pro-preview:default",
    name: "Gemini 3 Pro Preview",
    provider: "vertex-ai",
    model: "gemini-3-pro-preview",
    baseModelId: "gemini-3-pro-preview",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    avgLatencyMs: 10000,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "review", "strategic"],
  },
  {
    id: "gemini-3-flash-preview:default",
    name: "Gemini 3 Flash Preview",
    provider: "vertex-ai",
    model: "gemini-3-flash-preview",
    baseModelId: "gemini-3-flash-preview",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.0002,
    costPer1kOutput: 0.0008,
    avgLatencyMs: 2500,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "routine", "fast_commands"],
  },
  {
    id: "gemini-3.1-pro-preview:default",
    name: "Gemini 3.1 Pro Preview",
    provider: "vertex-ai",
    model: "gemini-3.1-pro-preview",
    baseModelId: "gemini-3.1-pro-preview",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 65536,
    costPer1kInput: 0.0015,
    costPer1kOutput: 0.012,
    avgLatencyMs: 11000,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["code_generation", "review", "analytical", "strategic"],
  },
  {
    id: "gemini-2.5-flash-lite:default",
    name: "Gemini 2.5 Flash Lite",
    provider: "vertex-ai",
    model: "gemini-2.5-flash-lite",
    baseModelId: "gemini-2.5-flash-lite",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 1048576,
    maxOutputTokens: 32768,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    avgLatencyMs: 1500,
    status: "active",
    region: "us-central1",
    endpoint: "generateContent",
    capabilities: ["routine", "fast_commands"],
  },
  {
    id: "mistral-medium-3:default",
    name: "Mistral Medium 3",
    provider: "vertex-ai",
    model: "mistral-medium-3",
    baseModelId: "mistral-medium-3",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 131072,
    maxOutputTokens: 8192,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.006,
    avgLatencyMs: 3000,
    status: "active",
    region: "us-central1",
    endpoint: "rawPredict",
    capabilities: ["code_generation", "generative"],
  },
  {
    id: "mistral-large-3:default",
    name: "Mistral Large 3",
    provider: "vertex-ai",
    model: "mistral-large-3",
    baseModelId: "mistral-large-3",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 131072,
    maxOutputTokens: 8192,
    costPer1kInput: 0.004,
    costPer1kOutput: 0.012,
    avgLatencyMs: 4500,
    status: "active",
    region: "us-central1",
    endpoint: "rawPredict",
    capabilities: ["code_generation", "review", "analytical"],
  },
  {
    id: "mistral-small-2503:default",
    name: "Mistral Small",
    provider: "vertex-ai",
    model: "mistral-small-2503",
    baseModelId: "mistral-small",
    thinkingMode: "default",
    maxContextWindow: 131072,
    maxOutputTokens: 8192,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.003,
    avgLatencyMs: 2000,
    status: "active",
    region: "us-central1",
    endpoint: "rawPredict",
    capabilities: ["routine", "generative"],
  },
  {
    id: "codestral-2:default",
    name: "Codestral 2",
    provider: "vertex-ai",
    model: "codestral-2",
    baseModelId: "codestral-2",
    thinkingMode: "default",
    supportsAdaptiveThinking: false,
    supportsExtendedThinking: false,
    supportsInterleavedThinking: false,
    supportsPrefilling: false,
    supportsStructuredOutputs: true,
    maxContextWindow: 262144,
    maxOutputTokens: 8192,
    costPer1kInput: 0.0003,
    costPer1kOutput: 0.0009,
    avgLatencyMs: 2500,
    status: "active",
    region: "us-central1",
    endpoint: "rawPredict",
    capabilities: ["code_generation", "routine"],
  },
  {
    id: "claude-3-haiku:none",
    name: "Claude 3 Haiku (Retired)",
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    baseModelId: "claude-3-haiku",
    thinkingMode: "none",
    status: "retired",
    region: "direct",
    endpoint: "messages",
    capabilities: [],
  },
  {
    id: "claude-3-5-haiku:none",
    name: "Claude 3.5 Haiku (Retired)",
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
    baseModelId: "claude-3-5-haiku",
    thinkingMode: "none",
    status: "retired",
    region: "direct",
    endpoint: "messages",
    capabilities: [],
  },
  {
    id: "claude-3-7-sonnet:extended:16k",
    name: "Claude 3.7 Sonnet (Retired)",
    provider: "anthropic",
    model: "claude-3-7-sonnet-20250219",
    baseModelId: "claude-3-7-sonnet",
    thinkingMode: "extended",
    thinkingParameter: "16k",
    status: "retired",
    region: "direct",
    endpoint: "messages",
    capabilities: [],
  },
  {
    id: "claude-3-opus:none",
    name: "Claude 3 Opus (Retired)",
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    baseModelId: "claude-3-opus",
    thinkingMode: "none",
    status: "retired",
    region: "direct",
    endpoint: "messages",
    capabilities: [],
  },
];

export async function bootstrapAgents(force: boolean = false): Promise<number> {
  if (!force) {
    const existing = await listActiveAgents();
    if (existing.length >= 20) {
      console.log(
        `Graph already has ${existing.length} active agents. Use force=true to re-seed.`,
      );
      return existing.length;
    }
  }

  console.log(`Seeding ${ALL_ARMS.length} agent configurations...`);
  let seeded = 0;

  for (const arm of ALL_ARMS) {
    try {
      await createAgent(arm);
      seeded++;
      console.log(`  ✅ ${arm.id} (${arm.status})`);
    } catch (err) {
      console.error(
        `  ❌ ${arm.id}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\nSeeded ${seeded}/${ALL_ARMS.length} agents.`);
  return seeded;
}

export const CORE_PATTERNS: PatternProps[] = [
  {
    id: "thompson-router",
    name: "Thompson Router",
    description: "Bayesian model selection via Thompson Sampling",
    morphemeKinds: ["resonator"],
    domain: "core",
  },
  {
    id: "dev-agent",
    name: "DevAgent Pipeline",
    description: "4-stage coding pipeline with correction helix",
    morphemeKinds: ["bloom", "helix"],
    domain: "core",
  },
  {
    id: "architect",
    name: "Architect Pipeline",
    description: "7-stage intent-to-execution planning",
    morphemeKinds: ["bloom"],
    domain: "core",
  },
  {
    id: "model-sentinel",
    name: "Model Sentinel",
    description: "Provider API probing and model discovery",
    morphemeKinds: ["resonator"],
    domain: "core",
    state: "design",
  },
];

export async function bootstrapPatterns(
  force: boolean = false,
): Promise<number> {
  if (!force) {
    const result = await runQuery(
      "MATCH (p:Pattern) RETURN count(p) AS count",
      {},
      "READ",
    );
    const existing = (result.records[0]?.get("count") as number) ?? 0;
    if (existing >= CORE_PATTERNS.length) {
      console.log(
        `Graph already has ${existing} patterns. Use force=true to re-seed.`,
      );
      return existing;
    }
  }

  console.log(`Seeding ${CORE_PATTERNS.length} core patterns...`);
  let seeded = 0;

  for (const pattern of CORE_PATTERNS) {
    try {
      await createPattern(pattern);
      seeded++;
      console.log(`  ✅ ${pattern.id} (${pattern.state ?? "created"})`);
    } catch (err) {
      console.error(
        `  ❌ ${pattern.id}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`\nSeeded ${seeded}/${CORE_PATTERNS.length} patterns.`);
  return seeded;
}

export async function seedInformedPriors(): Promise<number> {
  const taskCategories = ["strategic", "analytical", "generative", "routine"];
  let created = 0;

  for (const arm of ALL_ARMS) {
    if (arm.status === "retired") continue;

    for (const taskType of taskCategories) {
      const hasCapability = arm.capabilities?.includes(taskType) ?? false;
      const isExpensive = (arm.costPer1kOutput ?? 0) > 0.01;

      let syntheticSuccessRate: number;
      if (taskType === "strategic") {
        syntheticSuccessRate = hasCapability ? 0.8 : 0.3;
      } else if (taskType === "routine") {
        syntheticSuccessRate =
          !isExpensive && (arm.avgLatencyMs ?? 5000) < 5000 ? 0.8 : 0.4;
      } else {
        syntheticSuccessRate = hasCapability ? 0.6 : 0.4;
      }

      const successes = Math.round(syntheticSuccessRate * 5);
      const failures = 5 - successes;

      const clusterId = `${taskType}:moderate:general`;
      await ensureContextCluster({
        id: clusterId,
        taskType,
        complexity: "moderate",
      });

      for (let i = 0; i < successes + failures; i++) {
        const isSuccess = i < successes;
        const decId = `bootstrap_${arm.id}_${taskType}_${i}`;
        await recordDecision({
          id: decId,
          taskType,
          complexity: "moderate",
          selectedAgentId: arm.id,
          wasExploratory: false,
          contextClusterId: clusterId,
        });
        await recordDecisionOutcome({
          decisionId: decId,
          success: isSuccess,
          qualityScore: isSuccess
            ? 0.7 + Math.random() * 0.2
            : 0.2 + Math.random() * 0.3,
          durationMs: arm.avgLatencyMs ?? 5000,
          cost: (arm.costPer1kOutput ?? 0.01) * 2,
        });
      }
      created += 5;
    }
  }

  console.log(`Seeded ${created} synthetic prior decisions.`);
  return created;
}

/**
 * Seed strong informed priors for the analytical context cluster.
 *
 * Target: Opus 4.6 arms dominate analytical task selection (~70-80%),
 * Opus 4.5 arms fill ~15-20%, everything else ~2-5% combined.
 *
 * Uses synthetic Decision nodes with IDs prefixed "analytical_prior_"
 * to distinguish from baseline bootstrap decisions. Idempotent: clears
 * old analytical_prior_ decisions before reseeding.
 */
export async function seedAnalyticalPriors(): Promise<number> {
  interface PriorConfig {
    armPattern: RegExp;
    alpha: number;
    beta: number;
  }

  const ANALYTICAL_PRIORS: PriorConfig[] = [
    { armPattern: /^claude-opus-4-6:/i, alpha: 12, beta: 1 },
    { armPattern: /^claude-opus-4-5:/i, alpha: 8, beta: 1 },
    { armPattern: /^claude-sonnet-4-6:/i, alpha: 2, beta: 3 },
    { armPattern: /^claude-sonnet-4-5:|^claude-sonnet-4:/i, alpha: 1, beta: 4 },
    { armPattern: /haiku/i, alpha: 1, beta: 6 },
    { armPattern: /gemini/i, alpha: 1, beta: 5 },
    { armPattern: /mistral|codestral/i, alpha: 1, beta: 6 },
    { armPattern: /^claude-opus-4-1:|^claude-opus-4:/i, alpha: 4, beta: 2 },
  ];

  const ANALYTICAL_COMPLEXITIES = ["trivial", "moderate", "complex", "critical"] as const;

  // Clear old analytical_prior_ decisions
  await runQuery(
    `MATCH (d:Decision) WHERE d.id STARTS WITH 'analytical_prior_' DETACH DELETE d`,
  );

  let created = 0;

  for (const arm of ALL_ARMS) {
    if (arm.status === "retired") continue;

    // Find matching prior config
    const config = ANALYTICAL_PRIORS.find((p) => p.armPattern.test(arm.id));
    if (!config) continue; // No prior config for this arm pattern

    const successes = config.alpha - 1; // α = successes + 1 (from getArmStatsForCluster)
    const failures = config.beta - 1; // β = failures + 1

    for (const complexity of ANALYTICAL_COMPLEXITIES) {
      const clusterId = `analytical:${complexity}:general`;
      await ensureContextCluster({
        id: clusterId,
        taskType: "analytical",
        complexity,
      });

      for (let i = 0; i < successes + failures; i++) {
        const isSuccess = i < successes;
        const decId = `analytical_prior_${arm.id}_${complexity}_${i}`;
        await recordDecision({
          id: decId,
          taskType: "analytical",
          complexity,
          selectedAgentId: arm.id,
          wasExploratory: false,
          contextClusterId: clusterId,
        });
        await recordDecisionOutcome({
          decisionId: decId,
          success: isSuccess,
          qualityScore: isSuccess
            ? 0.8 + Math.random() * 0.15
            : 0.15 + Math.random() * 0.2,
          durationMs: arm.avgLatencyMs ?? 5000,
          cost: (arm.costPer1kOutput ?? 0.01) * 2,
        });
      }
      created += successes + failures;
    }
  }

  console.log(`Seeded ${created} analytical prior decisions.`);
  return created;
}

async function main() {
  console.log("🌱 Codex Signum — Agent Bootstrap\n");
  const force = process.argv.includes("--force");

  try {
    const schema = await migrateSchema();
    if (schema.errors.length > 0) {
      throw new Error(`Schema migration errors: ${schema.errors.join(" | ")}`);
    }
    console.log(`Applied schema statements: ${schema.applied}`);

    const seededRules = await seedConstitutionalRules();
    console.log(`Seeded constitutional rules: ${seededRules}`);

    await bootstrapAgents(force);
    await bootstrapPatterns(force);
    if (
      force ||
      (await getDecisionsForCluster("strategic:moderate:general", 1)).length ===
        0
    ) {
      await seedInformedPriors();
    }
  } catch (err) {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

const invokedPath = process.argv[1];
const isDirectRun = invokedPath
  ? import.meta.url === pathToFileURL(invokedPath).href
  : false;

if (isDirectRun) {
  void main();
}
