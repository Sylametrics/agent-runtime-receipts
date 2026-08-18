import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  RuntimeRecorder,
  compareDecimalStrings,
  summarizeEconomics,
  type ExecutionOutcome,
  type ExecutionReceipt,
  type JsonValue,
  type ReceiptEvent,
} from "@agent-receipts/core";

export interface OriEvalConstraints {
  maxCostUsd?: string;
  maxLatencyMs?: number;
  minQualityScore?: number;
  requiredTools?: string[];
  forbiddenTools?: string[];
}

export interface OriEvalArtifact {
  path: string;
  sha256: string;
}

export interface OriEvalBaseline {
  kind: "openrouter.ori-eval";
  id: string;
  createdAt: string;
  selectedModel: string;
  harness?: string;
  constraints: OriEvalConstraints;
  evalArtifacts?: OriEvalArtifact[];
  reportArtifact?: OriEvalArtifact;
  metadata?: Record<string, JsonValue>;
}

export interface CreateOriBaselineOptions {
  id: string;
  selectedModel: string;
  harness?: string;
  constraints?: OriEvalConstraints;
  evalFiles?: string[];
  reportFile?: string;
  createdAt?: string;
  metadata?: Record<string, JsonValue>;
}

export interface OriRuntimeCheck {
  name: "model" | "cost" | "latency" | "quality" | "required-tools" | "forbidden-tools";
  passed: boolean;
  expected?: JsonValue;
  actual?: JsonValue;
}

export interface OriRuntimeAssessment {
  baselineId: string;
  passed: boolean;
  checks: OriRuntimeCheck[];
}

async function hashFile(path: string): Promise<OriEvalArtifact> {
  const bytes = await readFile(path);
  const digest = createHash("sha256").update(bytes).digest("hex");
  return { path, sha256: `sha256:${digest}` };
}

export async function createOriEvalBaseline(options: CreateOriBaselineOptions): Promise<OriEvalBaseline> {
  const evalArtifacts = options.evalFiles?.length
    ? await Promise.all(options.evalFiles.map(hashFile))
    : undefined;
  const reportArtifact = options.reportFile ? await hashFile(options.reportFile) : undefined;

  return {
    kind: "openrouter.ori-eval",
    id: options.id,
    createdAt: options.createdAt ?? new Date().toISOString(),
    selectedModel: options.selectedModel,
    ...(options.harness ? { harness: options.harness } : {}),
    constraints: structuredClone(options.constraints ?? {}),
    ...(evalArtifacts ? { evalArtifacts } : {}),
    ...(reportArtifact ? { reportArtifact } : {}),
    ...(options.metadata ? { metadata: structuredClone(options.metadata) } : {}),
  };
}

function asJson(value: OriEvalBaseline | OriRuntimeAssessment): Record<string, JsonValue> {
  return JSON.parse(JSON.stringify(value)) as Record<string, JsonValue>;
}

export function recordOriEvalBaseline(recorder: RuntimeRecorder, baseline: OriEvalBaseline): void {
  recorder.custom({
    name: "openrouter.ori.baseline",
    data: asJson(baseline),
  });
}

function assess(
  events: readonly ReceiptEvent[],
  outcome: ExecutionOutcome,
  baseline: OriEvalBaseline,
): OriRuntimeAssessment {
  const checks: OriRuntimeCheck[] = [];
  const models = [...new Set(events.filter((event) => event.type === "model.usage").map((event) => event.model))];
  checks.push({
    name: "model",
    passed: models.includes(baseline.selectedModel),
    expected: baseline.selectedModel,
    actual: models,
  });

  const economics = summarizeEconomics(events, "USD");
  if (baseline.constraints.maxCostUsd !== undefined) {
    checks.push({
      name: "cost",
      passed: economics.currency === "USD" && compareDecimalStrings(economics.totalCost.amount, baseline.constraints.maxCostUsd) <= 0,
      expected: { maxUsd: baseline.constraints.maxCostUsd },
      actual: { amount: economics.totalCost.amount, currency: economics.currency },
    });
  }

  if (baseline.constraints.maxLatencyMs !== undefined) {
    const latency = outcome.latencyMs;
    checks.push({
      name: "latency",
      passed: latency !== undefined && latency <= baseline.constraints.maxLatencyMs,
      expected: baseline.constraints.maxLatencyMs,
      actual: latency ?? null,
    });
  }

  if (baseline.constraints.minQualityScore !== undefined) {
    const quality = outcome.qualityScore;
    checks.push({
      name: "quality",
      passed: quality !== undefined && quality >= baseline.constraints.minQualityScore,
      expected: baseline.constraints.minQualityScore,
      actual: quality ?? null,
    });
  }

  const calledTools = new Set(events.filter((event) => event.type === "tool.usage").map((event) => event.tool));
  if (baseline.constraints.requiredTools?.length) {
    const missing = baseline.constraints.requiredTools.filter((tool) => !calledTools.has(tool));
    checks.push({
      name: "required-tools",
      passed: missing.length === 0,
      expected: baseline.constraints.requiredTools,
      actual: [...calledTools],
    });
  }

  if (baseline.constraints.forbiddenTools?.length) {
    const calledForbidden = baseline.constraints.forbiddenTools.filter((tool) => calledTools.has(tool));
    checks.push({
      name: "forbidden-tools",
      passed: calledForbidden.length === 0,
      expected: baseline.constraints.forbiddenTools,
      actual: calledForbidden,
    });
  }

  return {
    baselineId: baseline.id,
    passed: checks.every((check) => check.passed),
    checks,
  };
}

export function assessSnapshotAgainstOriBaseline(
  events: readonly ReceiptEvent[],
  outcome: ExecutionOutcome,
  baseline: OriEvalBaseline,
): OriRuntimeAssessment {
  return assess(events, outcome, baseline);
}

export function assessReceiptAgainstOriBaseline(
  receipt: ExecutionReceipt,
  baseline: OriEvalBaseline,
): OriRuntimeAssessment {
  return assess(receipt.events, receipt.outcome, baseline);
}

export function recordOriRuntimeAssessment(
  recorder: RuntimeRecorder,
  assessment: OriRuntimeAssessment,
): void {
  recorder.evaluate({
    evaluator: "openrouter.ori",
    metric: "runtime-envelope",
    score: assessment.passed ? 1 : 0,
    passed: assessment.passed,
    metadata: asJson(assessment),
  });
}
