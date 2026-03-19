import { SELFCARE_AES_IV, SELFCARE_AES_KEY } from "./constants";
import { LoginError } from "./errors";

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  throw new LoginError("当前运行环境不支持 Base64 编码");
}

export async function encryptSelfcareUsername(word: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new LoginError("当前运行环境不支持 Web Crypto");
  }

  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SELFCARE_AES_KEY);
  const iv = encoder.encode(SELFCARE_AES_IV);

  if (keyBytes.byteLength !== 16 || iv.byteLength !== 16) {
    throw new LoginError("备用认证加密参数无效");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoder.encode(word)
  );

  return bytesToBase64(new Uint8Array(cipherBuffer));
}

export function normalizePhoneLast4(phoneLast4: string): string {
  const value = phoneLast4.trim();
  if (!/^\d{4}$/.test(value)) {
    throw new LoginError("手机号后四位必须是 4 位数字");
  }
  return value;
}

export function isPhoneLast4Matched(
  content: string,
  phoneLast4: string
): boolean {
  const digits = content.replace(/\D/g, "");
  return digits.endsWith(phoneLast4);
}
