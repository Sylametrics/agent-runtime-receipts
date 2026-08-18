#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ExecutionReceipt } from "@agent-receipts/core";
import { validateReceipt, verifyReceipt } from "@agent-receipts/core";

async function readReceipt(path: string): Promise<ExecutionReceipt> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as ExecutionReceipt;
}

function usage(): never {
  console.error("Usage: agent-receipts <verify|summarize> <receipt.json>");
  process.exit(2);
}

async function main(): Promise<void> {
  const [, , command, path] = process.argv;
  if (!command || !path) usage();
  const receipt = await readReceipt(path);

  if (command === "verify") {
    try {
      validateReceipt(receipt);
      const result = verifyReceipt(receipt);
      if (!result.valid) {
        console.error(`INVALID ${result.reason ?? "proof mismatch"}`);
        console.error(`expected ${result.expectedDigest}`);
        console.error(`actual   ${result.actualDigest}`);
        process.exitCode = 1;
        return;
      }
      console.log(`VALID ${receipt.execution.id}`);
      console.log(receipt.proof.digest);
      return;
    } catch (error) {
      console.error(`INVALID ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
      return;
    }
  }

  if (command === "summarize") {
    console.log(`${receipt.execution.agentId}: ${receipt.execution.task}`);
    console.log(`status: ${receipt.outcome.status}`);
    if (receipt.outcome.qualityScore !== undefined) console.log(`quality: ${receipt.outcome.qualityScore}`);
    console.log(`total: ${receipt.economics.totalCost.amount} ${receipt.economics.currency}`);
    console.log(`model: ${receipt.economics.modelCost.amount}`);
    console.log(`tools: ${receipt.economics.toolCost.amount}`);
    console.log(`payments: ${receipt.economics.paymentCost.amount}`);
    console.log(`recovery: ${receipt.economics.recoveryCost.amount}`);
    console.log(`events: ${receipt.events.length}`);
    console.log(`proof: ${receipt.proof.digest}`);
    return;
  }

  usage();
}

await main();
