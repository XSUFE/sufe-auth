export const SUFE_ENDPOINTS = {
  captcha: "https://login.sufe.edu.cn/esc-sso/api/v1/image/getRandcode",
  smsSend: "https://login.sufe.edu.cn/esc-sso/api/v3/sms/send",
  doLogin: "https://login.sufe.edu.cn/esc-sso/api/v3/auth/doLogin",
} as const;

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

function createBaseHeaders(userAgent = DEFAULT_USER_AGENT): HeadersInit {
  return {
    "User-Agent": userAgent,
    Accept: "*/*",
    "Accept-Language": "zh_CN",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Connection: "keep-alive",
  };
}

function extractCookie(setCookie: string | null): string {
  if (!setCookie) {
    throw new LoginError("无法获取会话 Cookie");
  }
  const cookie = setCookie.split(";")[0]?.trim();
  if (!cookie) {
    throw new LoginError("会话 Cookie 为空");
  }
  return cookie;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new LoginError(`服务返回非 JSON 响应: ${text.slice(0, 200)}`);
  }
}

function errorDetail(body: unknown): string {
  if (typeof body === "string") {
    return body.slice(0, 500);
  }
  if (isRecord(body)) {
    return JSON.stringify(body).slice(0, 500);
  }
  return "";
}

function parseSsoResponse<T>(body: unknown, action: string): SsoResponse<T> {
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

function assertSsoSuccess<T>(response: SsoResponse<T>, action: string): void {
  if (response.code !== "0") {
    throw new LoginError(`${action}失败(${response.code}): ${response.msg}`);
  }
}

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

export type SsoResponse<T> = {
  code: string;
  msg: string;
  timestamp: number;
  data: T;
};

export type SmsSendData = number | string | boolean | null;

export type LoginData = {
  redirect?: string;
  failedLogins?: number;
  authType?: string;
};

export type CaptchaResult = {
  cookie: string;
  image: Uint8Array;
};

export type SmsSendResult = {
  status: number;
  body: SsoResponse<SmsSendData>;
  cookie: string;
  url: string;
};

export type LoginResult = {
  status: number;
  body: SsoResponse<LoginData>;
  cookie: string;
};

export type RequestOptions = {
  userAgent?: string;
};

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

export type SendSmsOptions = RequestOptions & {
  username: string;
  vcode: string;
  cookie: string;
  timestamp?: number;
};

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
  assertSsoSuccess(parsed, "发送短信");

  return {
    status: response.status,
    body: parsed,
    cookie: options.cookie,
    url,
  };
}

export type LoginOptions = RequestOptions & {
  username: string;
  smsCode: string;
  cookie: string;
};

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
  assertSsoSuccess(parsed, "登录");

  return {
    status: response.status,
    body: parsed,
    cookie: options.cookie,
  };
}
