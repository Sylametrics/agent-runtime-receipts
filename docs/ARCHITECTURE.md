# Architecture

## Boundary

Agent Runtime Receipts sits above provider traces and payment receipts.

```text
Agent runtime
  |
  +-- model calls ----------> model.usage events
  +-- tools ----------------> tool.usage events
  +-- retries --------------> retry events
  +-- x402 / other payments -> payment events
  +-- evaluators -----------> evaluation events
  |
  v
ExecutionRecorder
  |
  +-- exact decimal economics
  +-- outcome
  +-- deterministic canonicalization
  +-- SHA-256 proof
  |
  v
Portable Runtime Receipt
```

A payment protocol answers whether/how a payment settled. A agent runtime receipt links that settlement to the rest of the run: inference, tools, recovery, and outcome.

## Package dependency direction

```text
                @agent-receipts/core
                 /      |       \
                /       |        \
       openrouter      x402      otel
                \       |        /
                 \      |       /
                      apps

                  cli -> core
```

`core` has no provider, chain, OpenTelemetry SDK, database, or network dependency. Adapters convert external facts into receipt events.

## Why adapters accept normalized data

Payment and provider SDKs change faster than the receipt format should. The x402 adapter therefore records a settlement *after* an application's x402 library has produced it instead of owning wallets, signing, verification, or settlement itself.

That keeps four responsibilities separate:

1. payment protocols move/verify value;
2. model providers report inference usage;
3. evaluators judge outcomes;
4. Syla combines those facts into one runtime view of costs, performance, and outcomes.

## Proof model

v0.1 uses SHA-256 over a deterministic representation of the receipt excluding `proof`. This detects post-generation modification but does not authenticate the creator.

Later versions can wrap the same digest with pluggable signatures or chain attestations without requiring private runtime content to be public.

## Commercial extension point

A future control plane can ingest the open receipt format while remaining logically separate from the SDK:

```text
OSS SDK / adapters
       |
       v
Runtime receipts
       |
       v
Commercial control plane
  +-- pre-run policy
  +-- budget enforcement
  +-- approvals
  +-- hosted retention/search
  +-- optimization
  +-- org analytics
  +-- enterprise access controls
```

The runtime record remains portable even if a customer stops using the hosted product.
