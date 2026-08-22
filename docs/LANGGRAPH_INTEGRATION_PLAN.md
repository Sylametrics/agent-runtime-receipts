# LangGraph integration plan

This document defines the next implementation pass. It deliberately does not add LangGraph to the repository yet; the current pass establishes the workspace and test boundaries that the integration will use.

## Goal

Add first-class, optional LangGraph support that converts one LangGraph execution into the existing Agent Receipts model.

The integration must prove that Agent Receipts can capture a stateful graph run without making the receipt format depend on LangGraph.

## Non-goals

The first integration should not:

- replace Agent Receipts core types with LangGraph types;
- turn Agent Receipts into a LangGraph runtime;
- implement every LangGraph persistence or deployment feature;
- require a paid model call for automated tests;
- duplicate OpenRouter-specific cost parsing already owned by `@agent-receipts/openrouter`;
- create a separate LangGraph-specific receipt schema.

## Proposed workspace additions

```text
packages/
  langgraph/
    package.json
    tsconfig.json
    README.md
    src/
      index.ts
      recorder.ts
      mapper.ts
      types.ts
      langgraph.test.ts

examples/
  langgraph-agent/
    package.json
    tsconfig.json
    README.md
    src/
      index.ts
```

The package should be named `@agent-receipts/langgraph`.

## Dependency direction

```text
@langchain/langgraph
        |
        v
@agent-receipts/langgraph
        |
        v
@agent-receipts/core
```

If the example uses OpenRouter, composition happens in the example/application:

```text
                 LangGraph execution
                        |
        +---------------+---------------+
        |                               |
        v                               v
@agent-receipts/langgraph      @agent-receipts/openrouter
        |                               |
        +---------------+---------------+
                        |
                        v
                @agent-receipts/core
                        |
                        v
                 ExecutionReceipt
```

`@agent-receipts/langgraph` must not depend on `@agent-receipts/openrouter`.

## Runtime facts to capture

The first version should map the facts that are useful across orchestration frameworks:

- graph/run identifier;
- execution start/end and status;
- node lifecycle information where stable and useful;
- model invocation usage supplied by the runtime/model integration;
- tool invocation name/operation;
- tool/model errors;
- retry/recovery information when observable;
- evaluation events supplied by the application;
- framework metadata identifying LangGraph as the orchestration source.

Only stable, defensible runtime facts should become core receipt data. Framework-specific details that do not justify a core schema field can be represented as bounded custom metadata/events.

## API shape to evaluate

The exact API should be chosen after implementing against the current LangGraph TypeScript interfaces, but the user experience should remain small. A likely direction is a recorder/bridge that is attached to or fed execution events and writes into an existing `RuntimeRecorder`.

Illustrative only:

```ts
import { RuntimeRecorder } from "@agent-receipts/core";
import { createLangGraphReceiptRecorder } from "@agent-receipts/langgraph";

const receipt = new RuntimeRecorder({
  agentId: "research-agent",
  task: "Research a topic",
});

const langgraph = createLangGraphReceiptRecorder(receipt);

// Connect `langgraph` to the graph's supported execution/event hooks.
```

Do not lock the public API to this sketch until the current LangGraph TypeScript lifecycle APIs have been implemented and tested.

## Deterministic automated tests

`pnpm test:langgraph` should not require API keys or network access.

Minimum test matrix:

1. one graph execution maps to one receipt execution;
2. a model call is represented once with correct usage metadata;
3. a tool call is represented once with the correct tool identity;
4. multiple model calls belong to the same execution receipt;
5. an execution failure is reflected without producing a false success outcome;
6. retry/recovery facts are captured when the selected LangGraph hook exposes them;
7. framework metadata does not alter canonicalization/proof behavior unexpectedly;
8. LangGraph and OpenRouter facts can compose in one receipt without double-counting model cost;
9. core package tests continue to pass without LangGraph installed as a core dependency.

## Runnable example

Add:

```bash
pnpm example:langgraph
```

The example should use a deliberately small graph so the receipt behavior is easy to inspect:

```text
START
  |
  v
plan/model
  |
  v
tool
  |
  v
respond/model
  |
  v
END
```

The preferred example should be capable of producing a real model/tool execution when credentials are supplied, but the automated test suite must use deterministic local doubles/fakes.

If OpenRouter is used for the live example, reuse `@agent-receipts/openrouter` for provider economics instead of copying OpenRouter mapping code into the LangGraph package.

## Root scripts to add in the LangGraph pass

```json
{
  "test:langgraph": "turbo run test --filter=@agent-receipts/langgraph",
  "example:langgraph": "turbo run build --filter=@agent-receipts/example-langgraph-agent && node examples/langgraph-agent/dist/index.js"
}
```

Add package-local `build`, `clean`, and `test` scripts to `@agent-receipts/langgraph`; add `build`/`clean` scripts to the example; then add the package/example project references to the root `tsconfig.json`. Turbo should discover the package relationship through workspace dependencies rather than a root test glob.

## How to verify the completed integration

After implementation:

```bash
pnpm install
pnpm test:langgraph
pnpm check
```

Then, for the optional live example:

```bash
# export the provider credentials required by the example
pnpm example:langgraph
```

Inspect the emitted receipt and confirm that it contains one execution with the expected model/tool/evaluation evidence and a valid receipt proof.

Finally run the clean verification:

```bash
pnpm verify
```

## Definition of done

LangGraph support is complete for the first release when:

- `@agent-receipts/langgraph` is an optional workspace package;
- `@agent-receipts/core` has no LangGraph dependency;
- deterministic LangGraph tests pass without network/API keys;
- the complete existing test suite still passes;
- a runnable LangGraph example produces a valid Agent Receipt;
- LangGraph + OpenRouter composition does not double-count usage/cost;
- README/package docs explain installation and usage;
- the generated receipt can be used as the source material for the first Sylametrics LangGraph/Agent Receipts technical article.
