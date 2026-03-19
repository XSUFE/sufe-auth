import { SUFE_ENDPOINTS } from "../core/constants";
import { LoginError } from "../core/errors";
import {
  assertSuccess,
  createBaseHeaders,
  errorDetail,
  parseJsonResponse,
  parseSsoResponse,
} from "../core/http";
import type { LoginData, LoginOptions, LoginResult } from "../core/types";

export async function login(options: LoginOptions): Promise<LoginResult> {
  const payload = {
    authType: "webSmsAuth",
    dataField: {
      username: options.username,
      password: "",
      smsCode: options.smsCode,
      vcode: "",
    },
    redirectUri: "",
  };

  const headers: HeadersInit = {
    ...createBaseHeaders(options.userAgent),
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Cookie: options.cookie,
  };

  const response = await fetch(SUFE_ENDPOINTS.doLogin, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new LoginError(
      `登录失败: ${response.status} ${response.statusText} ${errorDetail(body)}`.trim()
    );
  }

  const parsed = parseSsoResponse<LoginData>(body, "登录");
  assertSuccess(parsed, "登录");

  return {
    status: response.status,
    body: parsed,
    cookie: options.cookie,
  };
}
