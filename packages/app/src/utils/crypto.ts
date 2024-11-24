// https://medium.com/@tony.infisical/guide-to-web-crypto-api-for-encryption-decryption-1a2c698ebc25
import { fromBase64, toBase64 } from "./buffer.js";

export const algorithm = {
  name: "AES-GCM",
  length: 256,
};

export function random(length: number): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(length)));
}

export function generateIv(): string {
  return random(16);
}

export function generateKey(): string {
  return random(32);
}

export function parseSecrets(
  ...input: (string | ArrayBuffer)[]
): ArrayBuffer[] {
  return input.map((v) => (typeof v === "string" ? fromBase64(v) : v));
}

export async function encrypt(
  input: string,
  iv: string | ArrayBuffer,
  key: string | ArrayBuffer,
) {
  const [ivBuffer, keyBuffer] = parseSecrets(iv, key);
  const encodedPlaintext = new TextEncoder().encode(input);
  const secretKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: algorithm.name, length: algorithm.length },
    true,
    ["encrypt", "decrypt"],
  );

  const result = await crypto.subtle.encrypt(
    { name: algorithm.name, iv: ivBuffer },
    secretKey,
    encodedPlaintext,
  );

  return toBase64(result);
}

export async function decrypt(
  input: string | ArrayBuffer,
  iv: string | ArrayBuffer,
  key: string | ArrayBuffer,
) {
  const [inputBuffer, ivBuffer, keyBuffer] = parseSecrets(input, iv, key);
  const secretKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: algorithm.name, length: algorithm.length },
    true,
    ["encrypt", "decrypt"],
  );
  const textBuffer = await crypto.subtle.decrypt(
    { name: algorithm.name, iv: ivBuffer },
    secretKey,
    inputBuffer,
  );

  return new TextDecoder().decode(textBuffer);
}
