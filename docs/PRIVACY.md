# Receipt Privacy Guidance

Runtime receipts can become sensitive even when they contain no prompts.

## Safe defaults

Prefer identifiers and aggregate metadata:

- model slug instead of complete model request;
- tool name instead of tool input/output;
- hashed or internal user/workflow ID instead of email;
- payment transaction reference instead of wallet secrets;
- outcome score instead of complete generated content.

## Do not record by default

- API keys or bearer tokens;
- wallet private keys or seed phrases;
- authentication cookies;
- raw personally identifiable information;
- complete prompts and model outputs;
- private retrieved documents;
- payment authorization payloads that enable replay.

The core library does not upload receipts anywhere. Storage, retention, access control, and redaction remain the embedding application's responsibility.
