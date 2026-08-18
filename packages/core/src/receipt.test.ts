import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeRecorder } from "./recorder.js";
import { verifyReceipt } from "./proof.js";

test("builds economics and verifies a runtime receipt", () => {
  const run = new RuntimeRecorder({ agentId: "test-agent", task: "Test", startedAt: "2026-08-17T00:00:00.000Z" });
  run.model({ provider: "openrouter", model: "test/model", inputTokens: 10, outputTokens: 2, cost: { amount: "0.10", currency: "USD" } });
  run.tool({ tool: "search", operation: "query", cost: { amount: "0.02", currency: "USD" } });
  run.retry({ attempt: 2, reason: "timeout", cost: { amount: "0.01", currency: "USD" } });
  run.payment({ protocol: "x402", amount: { amount: "0.001", currency: "USD" }, network: "solana:test" });
  run.evaluate({ evaluator: "test", metric: "success", score: 1, passed: true });

  const receipt = run.finalize({ status: "succeeded", qualityScore: 1 }, "2026-08-17T00:00:01.000Z");
  assert.equal(receipt.economics.totalCost.amount, "0.131");
  assert.equal(receipt.economics.recoveryCost.amount, "0.01");
  assert.equal(verifyReceipt(receipt).valid, true);

  const tampered = structuredClone(receipt);
  tampered.outcome.qualityScore = 0.5;
  assert.equal(verifyReceipt(tampered).valid, false);
});
