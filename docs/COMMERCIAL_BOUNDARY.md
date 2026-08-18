# OSS / Commercial Boundary

Agent Runtime Receipts is intended to be genuinely useful as open source. The commercial opportunity is **not** charging developers to create or inspect their own receipt.

## Apache-2.0 OSS

- receipt schema and types
- local recorder/builder
- deterministic hashing and verification
- provider adapters
- payment-rail adapters
- local CLI
- OpenTelemetry export helpers
- examples
- verifier test vectors

## Future commercial control plane

A separate hosted/enterprise product can consume the open format and add organization-level capabilities:

### Before a run

- maximum spend per task/agent/team
- approved vendors and payment destinations
- approval thresholds
- model/tool allowlists
- policy-as-code
- hard blocking and escalation

### During a run

- centralized policy decisions
- spend reservation/budget allocation
- anomaly detection
- organization-wide alerts

### After a run

- hosted retention/search
- cost per successful outcome
- quality-per-dollar comparisons
- recovery/waste analysis
- route/model/vendor optimization
- team/showback/chargeback reporting
- compliance exports

### Enterprise administration

- SSO/SAML
- RBAC
- audit administration
- data residency/retention controls
- private networking/deployment
- SLA and managed support

The principle is simple: **the runtime format stays portable; centralized governance and intelligence are products.**
