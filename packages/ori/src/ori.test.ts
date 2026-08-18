import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeRecorder } from "@agent-receipts/core";
import { assessSnapshotAgainstOriBaseline, recordOriEvalBaseline, recordOriRuntimeAssessment, type OriEvalBaseline } from "./index.js";

const baseline: OriEvalBaseline = {
  kind: "openrouter.ori-eval",
  id: "ori-baseline-1",
  createdAt: "2026-08-17T00:00:00.000Z",
  selectedModel: "openai/gpt-5.6-sol",
  constraints: {
    maxCostUsd: "0.05",
    maxLatencyMs: 30000,
    minQualityScore: 0.9,
    requiredTools: ["search"],
    forbiddenTools: ["delete_file"],
  },
};

test("records Ori baseline and proves runtime stayed inside its envelope", () => {
  const recorder = new RuntimeRecorder({ agentId: "research", task: "Research topic" });
  recordOriEvalBaseline(recorder, baseline);
  recorder.model({ provider: "openrouter", model: "openai/gpt-5.6-sol", inputTokens: 100, outputTokens: 50, cost: { amount: "0.02", currency: "USD" } });
  recorder.tool({ tool: "search", operation: "query", cost: { amount: "0.005", currency: "USD" } });

  const outcome = { status: "succeeded" as const, qualityScore: 0.94, latencyMs: 12000 };
  const assessment = assessSnapshotAgainstOriBaseline(recorder.snapshot(), outcome, baseline);
  assert.equal(assessment.passed, true);
  recordOriRuntimeAssessment(recorder, assessment);

  const receipt = recorder.finalize(outcome);
  assert.equal(receipt.events.some((event) => event.type === "evaluation" && event.evaluator === "openrouter.ori"), true);
});

test("fails when runtime drifts beyond Ori cost envelope", () => {
  const recorder = new RuntimeRecorder({ agentId: "research", task: "Research topic" });
  recorder.model({ provider: "openrouter", model: "openai/gpt-5.6-sol", inputTokens: 100, outputTokens: 50, cost: { amount: "0.08", currency: "USD" } });
  recorder.tool({ tool: "search", operation: "query" });
  const assessment = assessSnapshotAgainstOriBaseline(recorder.snapshot(), { status: "succeeded", qualityScore: 0.95, latencyMs: 10000 }, baseline);
  assert.equal(assessment.passed, false);
  assert.equal(assessment.checks.find((check) => check.name === "cost")?.passed, false);
});
