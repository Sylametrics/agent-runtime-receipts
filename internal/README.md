# Internal repository tooling

This directory contains tooling used to develop the Agent Receipts repository itself. Nothing under `internal/` is part of the public Agent Receipts API.

- `scripts/check-package-boundaries.mjs` enforces the workspace dependency rule: `@agent-receipts/core` cannot depend on sibling packages, and integration packages may depend on `core` but not on one another.

Keeping repository-only tooling here follows the same separation used by mature multi-package projects: public packages stay under `packages/`, runnable consumer examples stay under `examples/`, and repository maintenance code stays internal.
