const DECIMAL_RE = /^\d+(\.\d+)?$/;

export function assertDecimalString(value: string, label = "amount"): void {
  if (!DECIMAL_RE.test(value)) {
    throw new Error(`${label} must be a non-negative base-10 decimal string; received ${JSON.stringify(value)}`);
  }
}

function parts(value: string): { integer: string; fraction: string } {
  assertDecimalString(value);
  const [integer = "0", fraction = ""] = value.split(".");
  return { integer, fraction };
}

export function addDecimalStrings(...values: string[]): string {
  if (values.length === 0) return "0";
  const parsed = values.map(parts);
  const scale = Math.max(...parsed.map((item) => item.fraction.length));
  const total = parsed.reduce((sum, item) => {
    const digits = `${item.integer}${item.fraction.padEnd(scale, "0")}`;
    return sum + BigInt(digits || "0");
  }, 0n);

  if (scale === 0) return total.toString();
  const padded = total.toString().padStart(scale + 1, "0");
  const integer = padded.slice(0, -scale);
  const fraction = padded.slice(-scale).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

export function normalizeMoneyAmount(value: string): string {
  const { integer, fraction } = parts(value);
  const normalizedInteger = BigInt(integer).toString();
  const normalizedFraction = fraction.replace(/0+$/, "");
  return normalizedFraction ? `${normalizedInteger}.${normalizedFraction}` : normalizedInteger;
}

export function compareDecimalStrings(left: string, right: string): -1 | 0 | 1 {
  const a = parts(normalizeMoneyAmount(left));
  const b = parts(normalizeMoneyAmount(right));
  const scale = Math.max(a.fraction.length, b.fraction.length);
  const aValue = BigInt(`${a.integer}${a.fraction.padEnd(scale, "0")}` || "0");
  const bValue = BigInt(`${b.integer}${b.fraction.padEnd(scale, "0")}` || "0");
  return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
}
