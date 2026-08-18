import { createHash, timingSafeEqual } from "node:crypto";
import { canonicalize } from "./canonical.js";
import type { ExecutionReceipt, ReceiptProof, UnprovedExecutionReceipt } from "./types.js";

export function digestReceipt(receipt: UnprovedExecutionReceipt): string {
  const digest = createHash("sha256").update(canonicalize(receipt), "utf8").digest("hex");
  return `sha256:${digest}`;
}

export function createProof(receipt: UnprovedExecutionReceipt, createdAt = new Date().toISOString()): ReceiptProof {
  return {
    algorithm: "sha256",
    canonicalization: "syla-json-v1",
    digest: digestReceipt(receipt),
    createdAt,
  };
}

export interface VerificationResult {
  valid: boolean;
  expectedDigest: string;
  actualDigest: string;
  reason?: string;
}

export function verifyReceipt(receipt: ExecutionReceipt): VerificationResult {
  if (receipt.proof.algorithm !== "sha256" || receipt.proof.canonicalization !== "syla-json-v1") {
    return {
      valid: false,
      expectedDigest: "unsupported",
      actualDigest: receipt.proof.digest,
      reason: "Unsupported proof algorithm or canonicalization",
    };
  }

  const { proof: _proof, ...unproved } = receipt;
  const expectedDigest = digestReceipt(unproved);
  const actualDigest = receipt.proof.digest;
  const expected = Buffer.from(expectedDigest);
  const actual = Buffer.from(actualDigest);
  const valid = expected.length === actual.length && timingSafeEqual(expected, actual);

  return {
    valid,
    expectedDigest,
    actualDigest,
    ...(valid ? {} : { reason: "Receipt content does not match its SHA-256 proof" }),
  };
}
