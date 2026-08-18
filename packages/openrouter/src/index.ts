import type { JsonValue, ModelUsageEvent } from "@agent-receipts/core";
import { RuntimeRecorder } from "@agent-receipts/core";

export interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
  prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
}

export interface OpenRouterResponseLike {
  id?: string;
  model?: string;
  provider?: string;
  usage?: OpenRouterUsage | null;
}

export interface RecordOpenRouterOptions {
  model?: string;
  provider?: string;
  requestId?: string;
  at?: string;
  metadata?: Record<string, JsonValue>;
}

export function recordOpenRouterUsage(
  recorder: RuntimeRecorder,
  response: OpenRouterResponseLike,
  options: RecordOpenRouterOptions = {},
): ModelUsageEvent {
  const usage = response.usage;
  if (!usage) throw new Error("OpenRouter response did not contain a usage object");
  if (usage.cost !== undefined && (!Number.isFinite(usage.cost) || usage.cost < 0)) {
    throw new Error("OpenRouter usage.cost must be a non-negative finite number");
  }

  return recorder.model({
    provider: options.provider ?? response.provider ?? "openrouter",
    model: options.model ?? response.model ?? "unknown",
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    ...(usage.completion_tokens_details?.reasoning_tokens !== undefined
      ? { reasoningTokens: usage.completion_tokens_details.reasoning_tokens }
      : {}),
    ...(usage.prompt_tokens_details?.cached_tokens !== undefined
      ? { cachedTokens: usage.prompt_tokens_details.cached_tokens }
      : {}),
    ...(usage.prompt_tokens_details?.cache_write_tokens !== undefined
      ? { cacheWriteTokens: usage.prompt_tokens_details.cache_write_tokens }
      : {}),
    ...(usage.cost !== undefined ? { cost: { amount: usage.cost.toString(), currency: "USD" } } : {}),
    ...(options.requestId ?? response.id ? { requestId: options.requestId ?? response.id } : {}),
    ...(options.at ? { at: options.at } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  });
}
