import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("APP_SECRET must be set to a strong secret (>=16 chars).");
  }
  // Derive a deterministic 32-byte key from APP_SECRET.
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string with AES-256-GCM.
 * Output format: base64(iv | authTag | ciphertext)
 */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptString(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
