import { addDecimalStrings, assertDecimalString, normalizeMoneyAmount } from "./decimal.js";
import type { EconomicsSummary, Money, ReceiptEvent } from "./types.js";

function money(amount: string, currency: string): Money {
  return { amount: normalizeMoneyAmount(amount), currency };
}

function eventMoney(event: ReceiptEvent): Money | undefined {
  switch (event.type) {
    case "model.usage":
    case "tool.usage":
    case "retry":
    case "custom":
      return event.cost;
    case "payment":
      return event.cost ?? event.amount;
    case "evaluation":
      return undefined;
  }
}

export function summarizeEconomics(events: readonly ReceiptEvent[], fallbackCurrency = "USD"): EconomicsSummary {
  const monies = events.map(eventMoney).filter((entry): entry is Money => Boolean(entry));
  for (const item of monies) assertDecimalString(item.amount);

  const currencies = new Set(monies.map((item) => item.currency));
  if (currencies.size > 1) {
    throw new Error(`A v0.1 receipt supports one economics currency; found: ${[...currencies].join(", ")}`);
  }
  const currency = monies[0]?.currency ?? fallbackCurrency;

  const sumFor = (predicate: (event: ReceiptEvent) => boolean): string =>
    addDecimalStrings(
      ...events
        .filter(predicate)
        .map(eventMoney)
        .filter((entry): entry is Money => Boolean(entry))
        .map((entry) => entry.amount),
    );

  const model = sumFor((event) => event.type === "model.usage");
  const tool = sumFor((event) => event.type === "tool.usage");
  const payment = sumFor((event) => event.type === "payment");
  const recovery = sumFor((event) => event.type === "retry");
  const custom = sumFor((event) => event.type === "custom");
  const total = addDecimalStrings(model, tool, payment, recovery, custom);

  return {
    currency,
    modelCost: money(model, currency),
    toolCost: money(tool, currency),
    paymentCost: money(payment, currency),
    recoveryCost: money(recovery, currency),
    customCost: money(custom, currency),
    totalCost: money(total, currency),
  };
}
