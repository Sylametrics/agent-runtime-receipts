import { writeFile } from "node:fs/promises";
import { RuntimeRecorder, verifyReceipt } from "@agent-receipts/core";
import { recordX402Settlement } from "@agent-receipts/x402";

const recorder = new RuntimeRecorder({
  agentId: "market-research-agent",
  task: "Produce a short competitor brief from a paid data source",
});

recorder.model({
  provider: "openrouter",
  model: "openai/gpt-4.1-mini",
  inputTokens: 1840,
  outputTokens: 510,
  cost: { amount: "0.012", currency: "USD" },
});

recordX402Settlement(recorder, {
  scheme: "exact",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  amount: "0.001",
  currency: "USDC",
  economicCost: { amount: "0.001", currency: "USD" },
  payee: "example-payee",
  transactionId: "example-signature",
  resource: "https://api.example.test/paid-data",
});

recorder.retry({
  attempt: 2,
  reason: "first source timed out",
  cost: { amount: "0.002", currency: "USD" },
});

recorder.evaluate({
  evaluator: "brief-rubric-v1",
  metric: "task_quality",
  score: 0.92,
  passed: true,
});

const receipt = recorder.finalize({ status: "succeeded", qualityScore: 0.92 });
await writeFile("receipt.example.json", `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({
  executionId: receipt.execution.id,
  totalCost: receipt.economics.totalCost,
  qualityScore: receipt.outcome.qualityScore,
  proofValid: verifyReceipt(receipt).valid,
}, null, 2));
