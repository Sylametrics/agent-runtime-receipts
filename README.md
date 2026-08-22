# Agent Receipts

**Open runtime receipts for AI agent costs, performance, and outcomes.**

Agent Receipts is an Apache-2.0 TypeScript toolkit for producing portable runtime receipts that answer a simple question:

> What did this agent spend, what resources did it use, what happened, and can the record be verified afterward?

The open-source boundary is the interoperable receipt, local verification, provider/payment adapters, and export helpers. Organization-wide policy enforcement, approvals, hosted retention, optimization intelligence, RBAC, and enterprise governance belong in a separate commercial control plane.

## Why this exists

Modern agent runs can combine model inference, tools, retries, retrieval, and machine payments. Those systems often expose each cost in a different place. Agent Receipts creates one runtime record that can contain:

- model usage and USD cost;
- tool/resource cost;
- x402 payment settlement references;
- retry and recovery cost;
- outcome/evaluation signals;
- a deterministic SHA-256 integrity check over the receipt payload.

Runtime receipt connects the costs, resources, performance, and outcome of the whole agent run.

## Repository status

**v0.2 developer preview.** The schema will change before v1. Do not treat the current proof as a regulatory, accounting, or legal attestation.

## Packages

| Package | Purpose |
| --- | --- |
| `@agent-receipts/core` | receipt types, builder, economics, canonicalization, hashing, verification |
| `@agent-receipts/openrouter` | map OpenRouter response usage into model economics |
| `@agent-receipts/x402` | normalize x402 settlement data into payment events |
| `@agent-receipts/ori` | connect OpenRouter Ori Eval baselines to production runtime receipts |
| `@agent-receipts/otel` | map receipt data to OpenTelemetry-compatible attributes |
| `@agent-receipts/cli` | verify and summarize receipt JSON files |

## Repository layout

Agent Receipts is organized as a multi-package pnpm workspace orchestrated with Turborepo. The package boundary is intentional: the core receipt model remains framework-neutral while provider, payment, evaluation, telemetry, and future orchestration integrations live in sibling packages.

```text
agent-runtime-receipts/
├── packages/
│   ├── core/
│   ├── openrouter/
│   ├── x402/
│   ├── ori/
│   ├── otel/
│   └── cli/
├── examples/
├── docs/
├── schema/
└── internal/
```

Integration packages depend on `@agent-receipts/core`, not on one another. Applications and examples compose integrations through the public core API. Turborepo uses that workspace dependency graph to build upstream packages first and cache unchanged package outputs. This keeps future integrations such as LangGraph optional rather than turning them into dependencies of the receipt format itself.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for package boundaries and [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the complete local test workflow. The scoped next-pass design is in [`docs/LANGGRAPH_INTEGRATION_PLAN.md`](docs/LANGGRAPH_INTEGRATION_PLAN.md).

## Quick start

```bash
pnpm install
pnpm check
pnpm example:basic
```

For a clean-from-generated-artifacts verification, run `pnpm verify`. Targeted package test commands and the manual fallback for environments without pnpm are documented in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

Basic usage:

```ts
import { RuntimeRecorder } from "@agent-receipts/core";

const run = new RuntimeRecorder({
  agentId: "research-agent",
  task: "Find and summarize three primary sources",
});

run.model({
  provider: "openrouter",
  model: "openai/gpt-4.1-mini",
  inputTokens: 1200,
  outputTokens: 340,
  cost: { amount: "0.0048", currency: "USD" },
});

run.tool({
  tool: "search",
  operation: "query",
  cost: { amount: "0.002", currency: "USD" },
});

run.evaluate({
  evaluator: "task-check",
  metric: "completion",
  score: 0.96,
  passed: true,
});

const receipt = run.finalize({
  status: "succeeded",
  qualityScore: 0.96,
});

console.log(receipt.economics.totalCost); // { amount: "0.0068", currency: "USD" }
console.log(receipt.proof.digest);        // sha256:...
```

Then verify it locally:

```bash
agent-receipts verify ./receipt.json
agent-receipts summarize ./receipt.json
```

## OpenRouter

OpenRouter includes token and cost information in response `usage`. The adapter converts that usage into a model event:

```ts
import { recordOpenRouterUsage } from "@agent-receipts/openrouter";

const data = await response.json();
recordOpenRouterUsage(run, data);
```

See `examples/openrouter-agent` for a complete fetch example.

## OpenRouter Ori Eval

Ori Eval is the pre-deployment evaluation layer; Agent Runtime Receipts connects that baseline to what happens at runtime. The `@agent-receipts/ori` bridge records the model and constraints approved by an Ori eval, hashes the eval/report artifacts, and checks production runs against that evaluated envelope.

```ts
import { recordOriEvalBaseline, assessSnapshotAgainstOriBaseline } from "@agent-receipts/ori";

recordOriEvalBaseline(run, baseline);
const assessment = assessSnapshotAgainstOriBaseline(run.snapshot(), outcome, baseline);
```

See [`docs/ORI_EVAL.md`](docs/ORI_EVAL.md) and `examples/ori-runtime-bridge`.

## x402

Syla does not replace x402 receipts or settlement proofs. It records the result of an x402 payment as one event in the broader runtime receipt:

```ts
import { recordX402Settlement } from "@agent-receipts/x402";

recordX402Settlement(run, {
  scheme: "exact",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  amount: "0.001",
  currency: "USDC",
  economicCost: { amount: "0.001", currency: "USD" },
  payee: "ExamplePayeeAddress",
  transactionId: "5j...signature",
  resource: "https://api.example.com/research",
});
```

The adapter accepts normalized settlement data so applications can use the x402 client/facilitator they prefer instead of coupling the receipt format to one SDK release.

## What is deliberately not in this repo

This project should stay useful without a Syla account. The following are intentionally outside the OSS boundary:

- organization budget policies and pre-run blocking;
- human approvals and escalation workflows;
- hosted ingestion and long-term retention;
- cross-agent spend analytics;
- vendor allow/deny policies;
- optimization/recommendation engines;
- SSO, RBAC, audit administration, and enterprise deployment controls.

See [`docs/COMMERCIAL_BOUNDARY.md`](docs/COMMERCIAL_BOUNDARY.md).

## Specification

The current schema is documented in [`docs/SPEC.md`](docs/SPEC.md). The proof covers the receipt without the `proof` field using deterministic, recursively key-sorted JSON serialization and SHA-256.

The v0.1 canonicalizer is intentionally small and implemented in this repository. A future v1 should consider adopting a formal external canonicalization standard before claiming cross-language stability.

## Current ecosystem references

This project is designed to complement, not fork, the protocols/providers it integrates with:

- OpenRouter Usage Accounting: https://openrouter.ai/docs/cookbook/administration/usage-accounting
- OpenRouter Ori Eval: https://openrouter.ai/docs/guides/ori/eval
- x402 specification/reference implementation: https://github.com/x402-foundation/x402
- Coinbase x402 docs: https://docs.cdp.coinbase.com/x402/welcome
- Solana agentic payments: https://solana.com/docs/payments/agentic-payments
- OpenTelemetry JavaScript: https://opentelemetry.io/docs/languages/js/

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
