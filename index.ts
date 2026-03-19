export const SUFE_ENDPOINTS = {
  captcha: "https://login.sufe.edu.cn/esc-sso/api/v1/image/getRandcode",
  smsSend: "https://login.sufe.edu.cn/esc-sso/api/v3/sms/send",
  doLogin: "https://login.sufe.edu.cn/esc-sso/api/v3/auth/doLogin",
  resetType:
    "https://login.sufe.edu.cn/portal/rest/selfcare/home/password/resetType",
} as const;

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";
const SELFCARE_AES_KEY = "supporForTodoKey";
const SELFCARE_AES_IV = "supporForTodo_Iv";

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

function parseSelfcareResponse<T>(
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

function assertSsoSuccess(
  response: { code: string; msg: string },
  action: string
): void {
  if (response.code !== "0") {
    throw new LoginError(`${action}失败(${response.code}): ${response.msg}`);
  }
}

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

async function encryptSelfcareUsername(word: string): Promise<string> {
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

function normalizePhoneLast4(phoneLast4: string): string {
  const value = phoneLast4.trim();
  if (!/^\d{4}$/.test(value)) {
    throw new LoginError("手机号后四位必须是 4 位数字");
  }
  return value;
}

function isPhoneLast4Matched(content: string, phoneLast4: string): boolean {
  const digits = content.replace(/\D/g, "");
  return digits.endsWith(phoneLast4);
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

export type SelfcareResponse<T> = {
  code: string;
  msg: string;
  version?: string;
  timestamp?: string | number;
  data: T;
};

export type SmsSendData = number | string | boolean | null;

export type LoginData = {
  redirect?: string;
  failedLogins?: number;
  authType?: string;
};

export type ResetTypeData = {
  content?: string;
  type?: string;
  nation?: string;
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

export type PhoneLast4AuthResult = {
  status: number;
  body: SelfcareResponse<ResetTypeData[] | null>;
  matched: true;
  url: string;
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

export type PhoneLast4AuthOptions = RequestOptions & {
  username: string;
  phoneLast4: string;
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

export async function secondAuthByPhoneLast4(
  options: PhoneLast4AuthOptions
): Promise<PhoneLast4AuthResult> {
  const username = options.username.trim();
  if (!username) {
    throw new LoginError("用户名不能为空");
  }

  const phoneLast4 = normalizePhoneLast4(options.phoneLast4);
  const encryptedUsername = await encryptSelfcareUsername(username);
  const params = new URLSearchParams({ username: encryptedUsername });
  const url = `${SUFE_ENDPOINTS.resetType}?${params.toString()}`;
  const headers: HeadersInit = {
    ...createBaseHeaders(options.userAgent),
    Accept: "application/json, text/plain, */*",
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  const body = await parseJsonResponse(response);

  if (!response.ok) {
    throw new LoginError(
      `备用认证失败: ${response.status} ${response.statusText} ${errorDetail(body)}`.trim()
    );
  }

  const parsed = parseSelfcareResponse<ResetTypeData[] | null>(
    body,
    "备用认证"
  );
  assertSsoSuccess(parsed, "备用认证");

  const methods = Array.isArray(parsed.data) ? parsed.data : [];
  const matched = methods.some((item) => {
    if (!isRecord(item)) return false;
    if (item.type !== "SMS") return false;
    if (typeof item.content !== "string") return false;
    return isPhoneLast4Matched(item.content, phoneLast4);
  });

  if (!matched) {
    throw new LoginError("备用认证失败: 手机号后四位不匹配");
  }

  return {
    status: response.status,
    body: parsed,
    matched: true,
    url,
  };
}

// Backward-compatible alias.
export const authByPhoneLast4 = secondAuthByPhoneLast4;
