# OpenRouter Ori Eval bridge

Agent Runtime Receipts should complement Ori Eval, not reproduce it.

Ori Eval answers a **pre-deployment model-selection question**: which model performs best for this application's real prompts, tool expectations, quality criteria, latency target, and cost ceiling?

Agent Runtime Receipts answers the corresponding **runtime accountability question**: did a production run actually use the evaluated model and remain inside the economic/behavioral envelope that was tested?

## Lifecycle

```text
ORI EVAL / CI
real prompts + tool assertions + judge + cost/latency limits
                         |
                         v
                 evaluated baseline
       model + thresholds + eval artifact hashes
                         |
                         v
PRODUCTION AGENT ---> SYLA RUNTIME RECEIPT
                         |
        model/tool/payment/retry/outcome signals
                         |
                         v
              runtime-envelope assessment
                         |
                         v
               tamper-evident receipt
```

## Why this boundary is useful

Ori already provides evaluation, model comparison, tool assertions, LLM judging, cost limits, latency limits, baselines, reports, and CI behavior. Syla should not implement a second evaluator.

Instead, `@agent-receipts/ori` turns the result of that engineering decision into a portable runtime baseline. A receipt can then record:

- the Ori baseline ID used to approve the model;
- the selected model;
- maximum runtime cost;
- maximum latency;
- minimum runtime quality score, when the application has one;
- required and forbidden tools;
- SHA-256 hashes of the eval files and optional Ori report;
- whether the production run remained inside that envelope.

The artifact hashes are important: they bind the runtime receipt to the exact eval material that justified the model decision without copying private eval prompts or datasets into the receipt.

## Creating a baseline

```ts
import { createOriEvalBaseline } from "@agent-receipts/ori";

const baseline = await createOriEvalBaseline({
  id: "support-agent-2026-08",
  selectedModel: "openai/gpt-5.6-sol",
  constraints: {
    maxCostUsd: "0.05",
    maxLatencyMs: 30_000,
    minQualityScore: 0.9,
    requiredTools: ["lookup_order"],
    forbiddenTools: ["issue_refund"],
  },
  evalFiles: ["evals/support/refunds.eval.ts"],
  reportFile: "eval-report.md",
});
```

This does not parse Ori's private/internal state. It only hashes artifacts you explicitly provide and records the constraints you chose. That keeps the bridge stable even if Ori's internal history representation changes.

## Recording it at runtime

```ts
recordOriEvalBaseline(recorder, baseline);

// ...record OpenRouter usage, tools, x402 payments, retries...

const outcome = {
  status: "succeeded" as const,
  qualityScore: 0.94,
  latencyMs: 14_200,
};

const assessment = assessSnapshotAgainstOriBaseline(
  recorder.snapshot(),
  outcome,
  baseline,
);

recordOriRuntimeAssessment(recorder, assessment);
const receipt = recorder.finalize(outcome);
```

The resulting receipt can therefore say more than "this run cost $0.031": it can say that the run used the model selected by the current Ori evaluation, respected the tool policy tested in that eval, stayed below the tested cost/latency ceilings, met the application's runtime quality floor, and includes those facts in the runtime receipt integrity check.

## Commercial path

The OSS bridge evaluates one production run against one declared baseline. The future commercial control plane can aggregate these receipts and answer organization-level questions such as:

- How often does production drift outside evaluated cost envelopes?
- Which agents are still running models that no longer match their approved baseline?
- How much spend occurred on runs that failed the quality floor?
- Which newer Ori-tested model would reduce cost per successful outcome?
- Should a deployment be blocked because its expected economics regressed?

That is where Ori's model-selection intelligence and Syla's runtime economics become complementary rather than competitive.
