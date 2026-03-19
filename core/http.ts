import { DEFAULT_USER_AGENT } from "./constants";
import { LoginError } from "./errors";
import type { SelfcareResponse, SsoResponse } from "./types";

export function createBaseHeaders(userAgent = DEFAULT_USER_AGENT): HeadersInit {
  return {
    "User-Agent": userAgent,
    Accept: "*/*",
    "Accept-Language": "zh_CN",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Connection: "keep-alive",
  };
}

export function extractCookie(setCookie: string | null): string {
  if (!setCookie) {
    throw new LoginError("无法获取会话 Cookie");
  }
  const cookie = setCookie.split(";")[0]?.trim();
  if (!cookie) {
    throw new LoginError("会话 Cookie 为空");
  }
  return cookie;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new LoginError(`服务返回非 JSON 响应: ${text.slice(0, 200)}`);
  }
}

export function errorDetail(body: unknown): string {
  if (typeof body === "string") {
    return body.slice(0, 500);
  }
  if (isRecord(body)) {
    return JSON.stringify(body).slice(0, 500);
  }
  return "";
}

export function parseSsoResponse<T>(
  body: unknown,
  action: string
): SsoResponse<T> {
  if (!isRecord(body)) {
    throw new LoginError(`${action}失败: 返回格式无效`);
  }

  const { code, msg, timestamp, data } = body;
  if (typeof code !== "string" || typeof msg !== "string") {
    throw new LoginError(`${action}失败: 缺少 code/msg`);
  }

  if (typeof timestamp !== "number") {
    throw new LoginError(`${action}失败: 缺少 timestamp`);
  }

  return {
    code,
    msg,
    timestamp,
    data: data as T,
  };
}

export function parseSelfcareResponse<T>(
  body: unknown,
  action: string
): SelfcareResponse<T> {
  if (!isRecord(body)) {
    throw new LoginError(`${action}失败: 返回格式无效`);
  }

  const { code, msg, version, timestamp, data } = body;
  if (typeof code !== "string" || typeof msg !== "string") {
    throw new LoginError(`${action}失败: 缺少 code/msg`);
  }

  if (
    (typeof timestamp !== "string" && typeof timestamp !== "number") ||
    timestamp === ""
  ) {
    throw new LoginError(`${action}失败: 缺少或无效 timestamp`);
  }

  return {
    code,
    msg,
    version: typeof version === "string" ? version : undefined,
    timestamp,
    data: data as T,
  };
}

export function assertSuccess(
  response: { code: string; msg: string },
  action: string
): void {
  if (response.code !== "0") {
    throw new LoginError(`${action}失败(${response.code}): ${response.msg}`);
  }
}
