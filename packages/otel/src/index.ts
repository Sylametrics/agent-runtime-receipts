import type { ExecutionReceipt, ReceiptEvent } from "@agent-receipts/core";

export type OtelAttributeValue = string | number | boolean | readonly string[] | readonly number[] | readonly boolean[];
export type OtelAttributes = Record<string, OtelAttributeValue>;

export function receiptAttributes(receipt: ExecutionReceipt): OtelAttributes {
  return {
    "syla.receipt.spec_version": receipt.specVersion,
    "syla.execution.id": receipt.execution.id,
    "syla.agent.id": receipt.execution.agentId,
    "syla.outcome.status": receipt.outcome.status,
    "syla.economics.currency": receipt.economics.currency,
    "syla.economics.total_cost": receipt.economics.totalCost.amount,
    "syla.economics.model_cost": receipt.economics.modelCost.amount,
    "syla.economics.tool_cost": receipt.economics.toolCost.amount,
    "syla.economics.payment_cost": receipt.economics.paymentCost.amount,
    "syla.economics.recovery_cost": receipt.economics.recoveryCost.amount,
    "syla.receipt.digest": receipt.proof.digest,
    ...(receipt.outcome.qualityScore !== undefined ? { "syla.outcome.quality_score": receipt.outcome.qualityScore } : {}),
  };
}

export function eventAttributes(event: ReceiptEvent): OtelAttributes {
  const base: OtelAttributes = {
    "syla.event.id": event.id,
    "syla.event.type": event.type,
  };

  switch (event.type) {
    case "model.usage":
      return {
        ...base,
        "gen_ai.provider.name": event.provider,
        "gen_ai.request.model": event.model,
        "gen_ai.usage.input_tokens": event.inputTokens,
        "gen_ai.usage.output_tokens": event.outputTokens,
        ...(event.cost ? { "syla.cost.amount": event.cost.amount, "syla.cost.currency": event.cost.currency } : {}),
      };
    case "tool.usage":
      return { ...base, "syla.tool.name": event.tool, "syla.tool.operation": event.operation };
    case "payment":
      return {
        ...base,
        "syla.payment.protocol": event.protocol,
        "syla.payment.amount": event.amount.amount,
        "syla.payment.currency": event.amount.currency,
        ...(event.network ? { "syla.payment.network": event.network } : {}),
      };
    case "retry":
      return { ...base, "syla.retry.attempt": event.attempt };
    case "evaluation":
      return { ...base, "syla.evaluation.metric": event.metric, "syla.evaluation.score": event.score };
    case "custom":
      return { ...base, "syla.custom.name": event.name };
  }
}
