# Contributing

Thanks for helping make agent runtime economics more interoperable.

## Development

```bash
pnpm install
pnpm check
```

Node.js 22+ is required. Turborepo is installed through the workspace and orchestrates package-local build/test tasks; no global Turbo install is required. Run `pnpm verify` for a clean build before releases or after changing workspace/project-reference configuration. See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for targeted tests, examples, package-boundary rules, and the checklist for adding an integration.

## Contribution principles

1. Keep the core receipt provider- and chain-neutral.
2. Prefer adapters over hard dependencies on vendor SDKs.
3. Never include API keys, wallet secrets, prompts, or sensitive tool payloads in fixtures.
4. Treat monetary values as decimal strings, never binary floating-point totals.
5. Changes to canonicalization or proof semantics require a schema-version discussion.
6. Keep hosted governance features out of this repository; see `docs/COMMERCIAL_BOUNDARY.md`.
7. Keep integration packages independent of sibling integrations; compose them through `@agent-receipts/core` in applications/examples.

## Pull requests

Include tests for behavior changes and describe any receipt-schema compatibility impact.
