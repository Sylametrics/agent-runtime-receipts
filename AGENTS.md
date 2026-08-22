# AGENTS.md

## Project purpose

Agent Receipts is a framework-neutral TypeScript toolkit for producing portable evidence about AI-agent runtime economics, resource use, evaluations, outcomes, and integrity.

## Repository model

This is a pnpm multi-package workspace orchestrated with Turborepo. Treat each directory under `packages/` as a public package boundary and each directory under `examples/` as an external consumer of those packages.

### Dependency rules

- `@agent-receipts/core` is the stable center and must not depend on provider/framework/payment/telemetry packages.
- Integration packages may depend on `@agent-receipts/core` but should not depend on sibling integrations.
- Compose integrations in examples or applications through core receipt APIs.
- Never import another package through relative filesystem paths.
- Keep external SDK/framework dependencies local to the integration that needs them.

### Turborepo rules

- Root `build`, `test`, and `clean` commands delegate to Turbo.
- Every workspace package must own its package-local task scripts; do not restore root glob-based compiled test lists.
- `build` tasks must remain dependency-aware through the workspace graph (`^build` in `turbo.json`).
- New integration packages should be targetable with a Turbo filter, for example `turbo run test --filter=@agent-receipts/langgraph`.
- Keep `.turbo/` and generated build artifacts out of version control.

### Planned LangGraph integration

The next planned integration is `packages/langgraph` with a runnable example under `examples/`. It must translate LangGraph execution facts into the existing receipt schema rather than changing core into a LangGraph-specific runtime.

Do not add LangGraph to `@agent-receipts/core`.

## Required verification

After changing code or workspace configuration, run:

```bash
pnpm check
```

Before a release or after changing project references/build configuration, run:

```bash
pnpm verify
```

For targeted work:

```bash
pnpm test:core
pnpm test:openrouter
pnpm test:x402
pnpm test:ori
pnpm test:integrations
```

See `docs/DEVELOPMENT.md` for full setup, examples, expected behavior, and the checklist for adding a new integration package.

## Safety and compatibility

- Never add secrets, real customer prompts, wallet keys, or sensitive tool payloads to tests/examples.
- Use decimal strings for money and preserve exact economics behavior.
- Changes to receipt schema, canonicalization, or proof semantics require explicit compatibility consideration.
- Keep hosted governance/control-plane behavior outside this repository.
