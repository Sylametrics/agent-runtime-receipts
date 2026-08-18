import { assertDecimalString } from "./decimal.js";
import { SPEC_VERSION, type ExecutionReceipt, type ReceiptEvent } from "./types.js";

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO-8601 timestamp`);
}

function assertScore(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1`);
}

function validateEvent(event: ReceiptEvent): void {
  assertIso(event.at, `event ${event.id} at`);
  if (event.type === "evaluation") assertScore(event.score, `evaluation ${event.id} score`);
  if (event.type === "model.usage") {
    for (const [label, value] of Object.entries({ inputTokens: event.inputTokens, outputTokens: event.outputTokens })) {
      if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
    }
  }
  if (event.type === "payment") assertDecimalString(event.amount.amount, `payment ${event.id} amount`);
  if ("cost" in event && event.cost) assertDecimalString(event.cost.amount, `event ${event.id} cost`);
}

export function validateReceipt(receipt: ExecutionReceipt): void {
  if (receipt.specVersion !== SPEC_VERSION) throw new Error(`Unsupported specVersion: ${receipt.specVersion}`);
  assertIso(receipt.execution.startedAt, "execution.startedAt");
  assertIso(receipt.execution.endedAt, "execution.endedAt");
  if (receipt.outcome.qualityScore !== undefined) assertScore(receipt.outcome.qualityScore, "outcome.qualityScore");
  receipt.events.forEach(validateEvent);
  assertDecimalString(receipt.economics.totalCost.amount, "economics.totalCost.amount");
}
