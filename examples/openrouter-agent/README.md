# OpenRouter example

```bash
cp .env.example .env
# export values into your shell; this project intentionally does not load .env files itself
export OPENROUTER_API_KEY="..."
pnpm example:openrouter
```

OpenRouter currently returns usage and cost data directly on completed responses. This example records that provider data into the broader runtime receipt.
