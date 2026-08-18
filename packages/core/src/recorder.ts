import { createId } from "./id.js";
import { summarizeEconomics } from "./economics.js";
import { createProof } from "./proof.js";
import { SPEC_VERSION, type CustomEvent, type EvaluationEvent, type ExecutionOutcome, type ExecutionReceipt, type JsonValue, type ModelUsageEvent, type Money, type PaymentEvent, type ReceiptEvent, type RetryEvent, type ToolUsageEvent, type UnprovedExecutionReceipt } from "./types.js";

interface RecorderOptions {
  executionId?: string;
  agentId: string;
  task: string;
  startedAt?: string;
  traceId?: string;
  metadata?: Record<string, JsonValue>;
  currency?: string;
}

type EventInput<T extends { id: string; at: string; type: string }> = Omit<T, "id" | "at" | "type"> & { id?: string; at?: string };

function stamped<T extends { id: string; at: string }>(prefix: string, event: Omit<T, "id" | "at"> & { id?: string; at?: string }): T {
  return {
    ...event,
    id: event.id ?? createId(prefix),
    at: event.at ?? new Date().toISOString(),
  } as T;
}

export class RuntimeRecorder {
  private readonly options: RecorderOptions;
  private readonly events: ReceiptEvent[] = [];
  private readonly startedAt: string;
  readonly executionId: string;
  private finalized = false;

  constructor(options: RecorderOptions) {
    this.options = { ...options };
    this.startedAt = options.startedAt ?? new Date().toISOString();
    this.executionId = options.executionId ?? createId("run");
  }

  record(event: ReceiptEvent): this {
    if (this.finalized) throw new Error("Cannot record events after finalization");
    this.events.push(structuredClone(event));
    return this;
  }

  model(event: EventInput<ModelUsageEvent>): ModelUsageEvent {
    const value = stamped<ModelUsageEvent>("evt", { ...event, type: "model.usage" });
    this.record(value);
    return value;
  }

  tool(event: EventInput<ToolUsageEvent>): ToolUsageEvent {
    const value = stamped<ToolUsageEvent>("evt", { ...event, type: "tool.usage" });
    this.record(value);
    return value;
  }

  payment(event: EventInput<PaymentEvent>): PaymentEvent {
    const value = stamped<PaymentEvent>("evt", { ...event, type: "payment" });
    this.record(value);
    return value;
  }

  retry(event: EventInput<RetryEvent>): RetryEvent {
    const value = stamped<RetryEvent>("evt", { ...event, type: "retry" });
    this.record(value);
    return value;
  }

  evaluate(event: EventInput<EvaluationEvent>): EvaluationEvent {
    const value = stamped<EvaluationEvent>("evt", { ...event, type: "evaluation" });
    this.record(value);
    return value;
  }

  custom(event: EventInput<CustomEvent>): CustomEvent {
    const value = stamped<CustomEvent>("evt", { ...event, type: "custom" });
    this.record(value);
    return value;
  }

  snapshot(): readonly ReceiptEvent[] {
    return structuredClone(this.events);
  }

  finalize(outcome: ExecutionOutcome, endedAt = new Date().toISOString()): ExecutionReceipt {
    if (this.finalized) throw new Error("RuntimeRecorder has already been finalized");
    this.finalized = true;
    const startedAt = this.startedAt;
    const latencyMs = outcome.latencyMs ?? Math.max(0, Date.parse(endedAt) - Date.parse(startedAt));
    const economics = summarizeEconomics(this.events, this.options.currency ?? "USD");

    const execution = {
      id: this.executionId,
      agentId: this.options.agentId,
      task: this.options.task,
      startedAt,
      endedAt,
      ...(this.options.traceId ? { traceId: this.options.traceId } : {}),
      ...(this.options.metadata ? { metadata: structuredClone(this.options.metadata) } : {}),
    };

    const normalizedOutcome: ExecutionOutcome = {
      ...structuredClone(outcome),
      latencyMs,
    };

    const unproved: UnprovedExecutionReceipt = {
      specVersion: SPEC_VERSION,
      execution,
      events: structuredClone(this.events),
      outcome: normalizedOutcome,
      economics,
    };

    return {
      ...unproved,
      proof: createProof(unproved, endedAt),
    };
  }
}

export type { RecorderOptions, Money };

/** @deprecated Use RuntimeRecorder. Kept as a compatibility alias during the developer preview. */
export { RuntimeRecorder as ExecutionRecorder };
