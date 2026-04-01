import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * Encryption utilities for storing API credentials securely
 * Uses AES-256-GCM with a derived key from JWT_SECRET
 */

const ALGORITHM = "aes-256-gcm";
const SALT = "crypto-tax-tracker"; // Fixed salt for deterministic key derivation

/**
 * Derive a 32-byte key from the JWT_SECRET using PBKDF2
 */
function deriveKey(): Buffer {
  return crypto.pbkdf2Sync(ENV.cookieSecret, SALT, 100000, 32, "sha256");
}

/**
 * Encrypt a string value (e.g., API key)
 * Returns a JSON string containing: iv, authTag, encryptedData (all base64 encoded)
 */
export function encryptValue(value: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  const result = {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptedData: encrypted,
  };

  return JSON.stringify(result);
}

/**
 * Decrypt a previously encrypted value
 * Expects a JSON string containing: iv, authTag, encryptedData
 */
export function decryptValue(encryptedJson: string): string {
  try {
    const key = deriveKey();
    const { iv, authTag, encryptedData } = JSON.parse(encryptedJson);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt value:", error);
    throw new Error("Failed to decrypt API credentials");
  }
}
