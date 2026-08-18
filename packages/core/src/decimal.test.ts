import assert from "node:assert/strict";
import test from "node:test";
import { addDecimalStrings, compareDecimalStrings, normalizeMoneyAmount } from "./decimal.js";

test("adds decimal strings without floating point loss", () => {
  assert.equal(addDecimalStrings("0.1", "0.2", "0.0001"), "0.3001");
  assert.equal(addDecimalStrings("1", "2.5000"), "3.5");
});

test("normalizes money amounts", () => {
  assert.equal(normalizeMoneyAmount("0000"), "0");
  assert.equal(normalizeMoneyAmount("12.34000"), "12.34");
});

test("compares decimal strings exactly", () => {
  assert.equal(compareDecimalStrings("0.05", "0.0500"), 0);
  assert.equal(compareDecimalStrings("0.049999", "0.05"), -1);
  assert.equal(compareDecimalStrings("12.1", "2.99"), 1);
});
