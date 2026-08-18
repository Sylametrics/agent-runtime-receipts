import { RuntimeRecorder } from "@agent-receipts/core";
import {
  assessSnapshotAgainstOriBaseline,
  recordOriEvalBaseline,
  recordOriRuntimeAssessment,
  type OriEvalBaseline,
} from "@agent-receipts/ori";

const baseline: OriEvalBaseline = {
  kind: "openrouter.ori-eval",
  id: "support-agent-2026-08",
  createdAt: new Date().toISOString(),
  selectedModel: "openai/gpt-5.6-sol",
  harness: "ori",
  constraints: {
    maxCostUsd: "0.05",
    maxLatencyMs: 30000,
    minQualityScore: 0.9,
    requiredTools: ["lookup_order"],
    forbiddenTools: ["issue_refund"],
  },
};

const recorder = new RuntimeRecorder({
  agentId: "support-agent",
  task: "Handle refund eligibility question",
});

recordOriEvalBaseline(recorder, baseline);
recorder.model({
  provider: "openrouter",
  model: "openai/gpt-5.6-sol",
  inputTokens: 1800,
  outputTokens: 420,
  cost: { amount: "0.031", currency: "USD" },
});
recorder.tool({ tool: "lookup_order", operation: "read" });

const outcome = {
  status: "succeeded" as const,
  qualityScore: 0.94,
  latencyMs: 14200,
};

const assessment = assessSnapshotAgainstOriBaseline(recorder.snapshot(), outcome, baseline);
recordOriRuntimeAssessment(recorder, assessment);
const receipt = recorder.finalize(outcome);

console.log(JSON.stringify({ assessment, receipt }, null, 2));
