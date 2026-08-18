import type { JsonValue, PaymentEvent } from "@agent-receipts/core";
import { RuntimeRecorder } from "@agent-receipts/core";

export interface X402Settlement {
  scheme: string;
  network: string;
  amount: string;
  currency: string;
  /** Optional valuation for runtime economics, e.g. { amount: "0.001", currency: "USD" } for a USDC settlement. */
  economicCost?: { amount: string; currency: string };
  payer?: string;
  payee?: string;
  transactionId?: string;
  resource?: string;
  at?: string;
  metadata?: Record<string, JsonValue>;
}

/**
 * Records an already-known x402 settlement as part of a whole-run runtime receipt.
 * This intentionally does not sign or settle payments and does not replace the
 * x402 protocol's own receipt/settlement data.
 */
export function recordX402Settlement(recorder: RuntimeRecorder, settlement: X402Settlement): PaymentEvent {
  return recorder.payment({
    protocol: "x402",
    scheme: settlement.scheme,
    network: settlement.network,
    amount: { amount: settlement.amount, currency: settlement.currency },
    ...(settlement.economicCost ? { cost: settlement.economicCost } : {}),
    ...(settlement.payer ? { payer: settlement.payer } : {}),
    ...(settlement.payee ? { payee: settlement.payee } : {}),
    ...(settlement.transactionId ? { transactionId: settlement.transactionId } : {}),
    ...(settlement.resource ? { resource: settlement.resource } : {}),
    ...(settlement.at ? { at: settlement.at } : {}),
    ...(settlement.metadata ? { metadata: settlement.metadata } : {}),
  });
}
