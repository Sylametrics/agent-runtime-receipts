# Contributing

Thanks for helping make agent runtime economics more interoperable.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Node.js 22+ is required.

## Contribution principles

1. Keep the core receipt provider- and chain-neutral.
2. Prefer adapters over hard dependencies on vendor SDKs.
3. Never include API keys, wallet secrets, prompts, or sensitive tool payloads in fixtures.
4. Treat monetary values as decimal strings, never binary floating-point totals.
5. Changes to canonicalization or proof semantics require a schema-version discussion.
6. Keep hosted governance features out of this repository; see `docs/COMMERCIAL_BOUNDARY.md`.

## Pull requests

Include tests for behavior changes and describe any receipt-schema compatibility impact.
