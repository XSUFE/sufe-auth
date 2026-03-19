import { SUFE_ENDPOINTS } from "../core/constants";
import { LoginError } from "../core/errors";
import {
  assertSuccess,
  createBaseHeaders,
  errorDetail,
  parseJsonResponse,
  parseSsoResponse,
} from "../core/http";
import type { SendSmsOptions, SmsSendData, SmsSendResult } from "../core/types";

export async function sendSms(options: SendSmsOptions): Promise<SmsSendResult> {
  const timestamp = options.timestamp ?? Date.now();
  const params = new URLSearchParams({
    username: options.username,
    vcode: options.vcode,
    _: String(timestamp),
  });

  const headers: HeadersInit = {
    ...createBaseHeaders(options.userAgent),
    Accept: "application/json, text/plain, */*",
    Cookie: options.cookie,
  };

  const url = `${SUFE_ENDPOINTS.smsSend}?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new LoginError(
      `发送短信失败: ${response.status} ${response.statusText} ${errorDetail(body)}`.trim()
    );
  }

  const parsed = parseSsoResponse<SmsSendData>(body, "发送短信");
  assertSuccess(parsed, "发送短信");

  return {
    status: response.status,
    body: parsed,
    cookie: options.cookie,
    url,
  };
}
