import { writeFile } from "node:fs/promises";
import { RuntimeRecorder } from "@agent-receipts/core";
import { recordOpenRouterUsage, type OpenRouterResponseLike } from "@agent-receipts/openrouter";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("Set OPENROUTER_API_KEY before running this example");
const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini";

const recorder = new RuntimeRecorder({
  agentId: "openrouter-demo",
  task: "Explain why runtime cost and outcome tracking matters in two sentences",
});

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: "Explain why tracking runtime cost and outcomes matters for autonomous AI agents in two sentences." }],
  }),
});

if (!response.ok) {
  throw new Error(`OpenRouter returned ${response.status}: ${await response.text()}`);
}

const data = (await response.json()) as OpenRouterResponseLike & {
  choices?: Array<{ message?: { content?: string } }>;
};
recordOpenRouterUsage(recorder, data, { model });

const quality = data.choices?.[0]?.message?.content ? 1 : 0;
recorder.evaluate({ evaluator: "non-empty-response", metric: "completion", score: quality, passed: quality === 1 });

const receipt = recorder.finalize({ status: quality === 1 ? "succeeded" : "failed", qualityScore: quality });
await writeFile("receipt.openrouter.json", `${JSON.stringify(receipt, null, 2)}\n`);

console.log(data.choices?.[0]?.message?.content ?? "(no content)");
console.log(`cost: ${receipt.economics.totalCost.amount} ${receipt.economics.currency}`);
console.log(`proof: ${receipt.proof.digest}`);
