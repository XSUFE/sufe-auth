import { SUFE_ENDPOINTS } from "../core/constants";
import { LoginError } from "../core/errors";
import {
  createBaseHeaders,
  errorDetail,
  extractCookie,
  parseJsonResponse,
} from "../core/http";
import type { CaptchaResult, RequestOptions } from "../core/types";

export async function getCaptcha(
  options?: RequestOptions
): Promise<CaptchaResult> {
  const headers = createBaseHeaders(options?.userAgent);
  const response = await fetch(SUFE_ENDPOINTS.captcha, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const body = await parseJsonResponse(response).catch(() => "");
    throw new LoginError(
      `获取验证码失败: ${response.status} ${response.statusText} ${errorDetail(body)}`.trim()
    );
  }

  const cookie = extractCookie(response.headers.get("set-cookie"));
  const image = new Uint8Array(await response.arrayBuffer());

  return { cookie, image };
}
