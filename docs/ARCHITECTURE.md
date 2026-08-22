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

The repository is a pnpm multi-package workspace. `core` is the stable contract; sibling packages translate external runtime facts into that contract.

```text
                       @agent-receipts/core
                         ^   ^   ^   ^   ^
                         |   |   |   |   |
       +-----------------+   |   |   |   +----------------+
       |                     |   |   |                    |
 openrouter                 x402 ori otel                 cli
       |                     |   |   |                    |
       +---------------------+---+---+--------------------+
                             |
                         applications
                          / examples
```

The dependency rule is deliberately stricter than the folder structure requires:

- `@agent-receipts/core` must not import another Agent Receipts package.
- Packages under `packages/` may depend on `core`, but should not depend on sibling integrations.
- Applications/examples may compose multiple packages.
- Integration-specific SDK/framework dependencies stay inside the relevant integration package.

`pnpm check:boundaries` enforces the Agent Receipts package-to-package portion of this rule.

### Why the workspace is flat

Provider, payment, evaluation, telemetry, CLI, and future orchestration integrations remain sibling packages instead of being hidden inside `core` or nested by category. This mirrors the useful part of mature framework monorepos: independently scoped packages evolve together in one repository while retaining explicit install/import boundaries.

The repository does not use Git submodules or a repository per adapter. It uses Turborepo on top of the pnpm workspace so package-local tasks can be dependency-aware, parallelized, and cached without weakening the package boundaries. TypeScript project references remain the compiler-level dependency model; Turbo orchestrates when package tasks run.

### Build orchestration

The root `turbo.json` defines the repository task graph:

```text
workspace dependency graph
        |
        v
Turbo build
  |
  +-- builds upstream packages first (`^build`)
  +-- caches `dist/**` and `*.tsbuildinfo`
  +-- runs independent package builds in parallel
  |
  v
package-local TypeScript builds/tests
```

Each workspace package owns its own `build`, `test` (when applicable), and `clean` scripts. Root commands such as `pnpm build` and `pnpm test` delegate to Turbo rather than hard-coding a list of package output paths. Targeted root commands use Turbo filters, which means adding `packages/langgraph` in the next pass will extend the same task graph instead of creating a second build system.

### Future LangGraph package

LangGraph should enter the repository as an optional sibling integration:

```text
packages/
  core/
  openrouter/
  x402/
  ori/
  otel/
  cli/
  langgraph/        # planned

examples/
  langgraph-agent/  # planned runnable consumer
```

`@agent-receipts/langgraph` should map LangGraph graph/run/model/tool lifecycle information into existing core events and receipt fields. It should not define a separate receipt format and it should not make LangGraph a dependency of `@agent-receipts/core`.

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for the package-addition and verification checklist.

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
