# Development and testing

Agent Receipts is a pnpm workspace containing independently scoped TypeScript packages and runnable examples. Turborepo orchestrates package-local build, test, and clean tasks across that workspace. This document is the source of truth for local verification before opening a pull request or starting a new integration.

## Requirements

- Node.js 22 or newer
- pnpm 10.15.0 (the version pinned in the root `package.json`)
- Turborepo is installed as a root development dependency; do not install it globally

If Corepack is available, you can activate the pinned pnpm version with:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

## Install

From the repository root:

```bash
pnpm install
```

## Fast verification

Run the normal project check:

```bash
pnpm check
```

`pnpm check` performs three things:

1. verifies package dependency boundaries;
2. lets Turborepo build the complete package/example graph in dependency order;
3. runs the complete compiled unit/integration test suite through package-local test tasks.

A successful run should finish with no TypeScript errors, no package-boundary violations, and all Node tests passing. On later runs, Turbo may report cache hits for unchanged package builds.

## Clean verification

Before a release or after changing TypeScript/project-reference configuration, run:

```bash
pnpm verify
```

This removes generated `dist` and `*.tsbuildinfo` files, verifies package boundaries, then runs the complete Turbo build/test graph with `--force` so cached build outputs are not used for the verification.

## Targeted tests

Use a targeted command while working on one package:

```bash
pnpm test:core
pnpm test:openrouter
pnpm test:x402
pnpm test:ori
pnpm test:integrations
```

Each targeted command is implemented with a Turbo filter. Turbo selects the requested package and uses the `build` task's upstream dependency rule to build required workspace dependencies first. It does not rebuild unrelated packages unnecessarily.

`@agent-receipts/otel` and `@agent-receipts/cli` currently have no package-specific test files, so they are validated through the Turbo build graph and the full repository check.

## Turborepo task graph

The root commands are orchestration commands:

```bash
pnpm build   # turbo run build
pnpm test    # turbo run test
pnpm clean   # turbo run clean
```

`turbo.json` defines:

- `build` -> depends on upstream workspace builds via `^build` and caches `dist/**` plus `*.tsbuildinfo`;
- `test` -> depends on the current package's `build`, so tests always run against compiled output;
- `clean` -> is intentionally uncached.

Every package under `packages/` and every runnable workspace under `examples/` owns its own `build`/`clean` script. Packages that contain tests also own a `test` script. Keep new integrations consistent with this model rather than adding root-only glob-based build/test logic.

## Examples

Examples are workspace consumers. They import public package names rather than reaching into package source directories.

```bash
pnpm example:basic
pnpm example:openrouter
pnpm example:ori
```

### OpenRouter example

The OpenRouter example makes a real network request and requires an API key:

```bash
export OPENROUTER_API_KEY="..."
pnpm example:openrouter
```

Do not commit API keys or generated `.env` files.

## Package architecture

The intended dependency direction is:

```text
@agent-receipts/core
        ^
        |
        +-- @agent-receipts/openrouter
        +-- @agent-receipts/x402
        +-- @agent-receipts/ori
        +-- @agent-receipts/otel
        +-- @agent-receipts/cli
```

Rules:

1. `core` must stay independent of providers, orchestration frameworks, payment protocols, telemetry SDKs, and hosted services.
2. A package under `packages/` may depend on `@agent-receipts/core`.
3. Integration packages should not depend directly on sibling integrations. Composition happens in an application/example through the common core contract.
4. Examples may compose multiple public packages.
5. Cross-package imports must use package names such as `@agent-receipts/core`, never `../../packages/core/src/...`.
6. External framework/SDK dependencies should live only in the package that integrates with them and should be optional/peer dependencies when appropriate.

Run the boundary check directly with:

```bash
pnpm check:boundaries
```

## Adding an integration package

The next planned example of this pattern is LangGraph. A new integration should be added as a sibling package, not folded into `core`:

```text
packages/
  core/
  openrouter/
  x402/
  ori/
  otel/
  cli/
  langgraph/        # future

examples/
  ...
  langgraph-agent/  # future
```

For a new package:

1. create `packages/<integration>/package.json`;
2. depend on `@agent-receipts/core` through `workspace:*`;
3. add its TypeScript project reference to the root `tsconfig.json`;
4. keep framework/provider-specific types and mapping code inside that package;
5. add deterministic tests that do not require paid API calls;
6. add a runnable example for real end-to-end verification when useful;
7. add package-local `build`, `clean`, and `test` scripts so Turbo can orchestrate the package;
8. add a targeted root test script using `turbo run test --filter=<package-name>`;
9. run `pnpm verify` before committing.

For LangGraph specifically, the integration should map graph/runtime execution facts into the existing receipt model. It should not introduce a second LangGraph-specific receipt schema, and installing `@agent-receipts/core` should not require LangGraph.

## Manual fallback when pnpm is unavailable

If dependencies are already installed but the pnpm executable is temporarily unavailable, the underlying checks can be reproduced with:

```bash
./node_modules/.bin/tsc -b
node internal/scripts/check-package-boundaries.mjs
node --test \
  packages/core/dist/*.test.js \
  packages/openrouter/dist/*.test.js \
  packages/x402/dist/*.test.js \
  packages/ori/dist/*.test.js
```

This fallback is useful for constrained environments, but pnpm remains the supported development workflow.
