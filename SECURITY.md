# Security Policy

## Reporting

Please do not open a public issue for a suspected vulnerability involving receipt verification, secret leakage, signing, or payment metadata. Report it privately to the project maintainers.

## Scope notes

Agent Runtime Receipts does not hold funds, sign blockchain transactions, or store provider credentials. Adapters accept post-run metadata from your application. Never place private keys, API keys, complete prompts, or sensitive tool responses into a receipt unless your own security model explicitly permits it.

The v0.1 SHA-256 proof provides integrity checking only. It does **not** prove who created the receipt. Authenticated signatures/attestations are a later milestone.
