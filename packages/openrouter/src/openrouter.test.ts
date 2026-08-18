import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeRecorder } from "@agent-receipts/core";
import { recordOpenRouterUsage } from "./index.js";

test("maps OpenRouter usage into a model event", () => {
  const recorder = new RuntimeRecorder({ agentId: "agent", task: "test" });
  const event = recordOpenRouterUsage(recorder, {
    id: "gen-1",
    model: "openai/gpt-4.1-mini",
    usage: {
      prompt_tokens: 194,
      completion_tokens: 2,
      cost: 0.0095,
      completion_tokens_details: { reasoning_tokens: 1 },
      prompt_tokens_details: { cached_tokens: 12, cache_write_tokens: 3 },
    },
  });

  assert.equal(event.provider, "openrouter");
  assert.equal(event.cost?.amount, "0.0095");
  assert.equal(event.reasoningTokens, 1);
  assert.equal(event.cachedTokens, 12);
});
