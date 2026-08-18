import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeRecorder } from "@agent-receipts/core";
import { recordX402Settlement } from "./index.js";

test("records an x402 settlement without taking custody or signing", () => {
  const recorder = new RuntimeRecorder({ agentId: "agent", task: "buy data", currency: "USDC" });
  const event = recordX402Settlement(recorder, {
    scheme: "exact",
    network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    amount: "0.001",
    currency: "USDC",
    economicCost: { amount: "0.001", currency: "USD" },
    transactionId: "signature",
    resource: "https://example.test/data",
  });
  assert.equal(event.protocol, "x402");
  assert.equal(event.amount.amount, "0.001");
  assert.equal(event.cost?.currency, "USD");
});
