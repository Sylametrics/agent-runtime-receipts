# Changelog

## 0.2.1 - 2026-08-17

- Reframed public language around **runtime receipts**, agent runs, costs, performance, and outcomes.
- Added `RuntimeRecorder` as the preferred public API name while keeping `ExecutionRecorder` as a developer-preview compatibility alias.
- Replaced public-facing "runtime evidence" / "execution" wording where it could sound forensic or ambiguous outside engineering contexts.

## 0.2.0 - 2026-08-17

- Added `@agent-receipts/ori` to bridge OpenRouter Ori Eval decisions into runtime receipts.
- Added hashed eval/report artifacts without depending on Ori internal history formats.
- Added runtime envelope checks for model, total cost, latency, quality, required tools, and forbidden tools.
- Added an Ori runtime bridge example and architecture documentation.

## 0.1.0 - 2026-08-17

Initial developer preview:

- runtime receipt schema and JSON Schema;
- exact decimal-string economics;
- deterministic canonicalization and SHA-256 verification;
- OpenRouter usage adapter;
- normalized x402 settlement adapter;
- OpenTelemetry-compatible attribute mapping;
- local verify/summarize CLI;
- basic and live OpenRouter examples;
- Apache-2.0 license and OSS/commercial boundary documentation.
