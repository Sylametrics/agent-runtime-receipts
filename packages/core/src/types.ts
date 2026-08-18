export const SPEC_VERSION = "syla.execution-receipt/0.1" as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface Money {
  amount: string;
  currency: string;
}

export interface EventBase {
  id: string;
  at: string;
  metadata?: Record<string, JsonValue>;
}

export interface ModelUsageEvent extends EventBase {
  type: "model.usage";
  provider: string;
  model: string;
  requestId?: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  cacheWriteTokens?: number;
  cost?: Money;
}

export interface ToolUsageEvent extends EventBase {
  type: "tool.usage";
  tool: string;
  operation: string;
  resource?: string;
  latencyMs?: number;
  cost?: Money;
}

export interface PaymentEvent extends EventBase {
  type: "payment";
  protocol: string;
  scheme?: string;
  network?: string;
  payer?: string;
  payee?: string;
  resource?: string;
  transactionId?: string;
  amount: Money;
  /** Economic valuation used in receipt totals when settlement currency differs. */
  cost?: Money;
}

export interface RetryEvent extends EventBase {
  type: "retry";
  attempt: number;
  reason?: string;
  sourceEventId?: string;
  cost?: Money;
}

export interface EvaluationEvent extends EventBase {
  type: "evaluation";
  evaluator: string;
  metric: string;
  score: number;
  passed?: boolean;
}

export interface CustomEvent extends EventBase {
  type: "custom";
  name: string;
  data?: Record<string, JsonValue>;
  cost?: Money;
}

export type ReceiptEvent =
  | ModelUsageEvent
  | ToolUsageEvent
  | PaymentEvent
  | RetryEvent
  | EvaluationEvent
  | CustomEvent;

export interface ExecutionDescriptor {
  id: string;
  agentId: string;
  task: string;
  startedAt: string;
  endedAt: string;
  traceId?: string;
  metadata?: Record<string, JsonValue>;
}

export type OutcomeStatus = "succeeded" | "failed" | "aborted" | "unknown";

export interface ExecutionOutcome {
  status: OutcomeStatus;
  summary?: string;
  qualityScore?: number;
  latencyMs?: number;
  metadata?: Record<string, JsonValue>;
}

export interface EconomicsSummary {
  currency: string;
  modelCost: Money;
  toolCost: Money;
  paymentCost: Money;
  recoveryCost: Money;
  customCost: Money;
  totalCost: Money;
}

export interface ReceiptProof {
  algorithm: "sha256";
  canonicalization: "syla-json-v1";
  digest: string;
  createdAt: string;
}

export interface ExecutionReceipt {
  specVersion: typeof SPEC_VERSION;
  execution: ExecutionDescriptor;
  events: ReceiptEvent[];
  outcome: ExecutionOutcome;
  economics: EconomicsSummary;
  proof: ReceiptProof;
}

export interface UnprovedExecutionReceipt extends Omit<ExecutionReceipt, "proof"> {}
