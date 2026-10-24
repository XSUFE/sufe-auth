/** Single sign-on response envelope; business code `"0"` indicates success. */
export type SsoResponse<T> = {
  code: string;
  msg: string;
  timestamp: number;
  data: T;
};

/** Self-care response envelope; business code `"0"` indicates success. */
export type SelfcareResponse<T> = {
  code: string;
  msg: string;
  version?: string;
  timestamp: string | number;
  data: T;
};

/** Service-specific SMS response payload, which may contain a retry delay. */
export type SmsSendData = number | string | boolean | null;

/** Session and redirect details returned after SMS login. */
export type LoginData = {
  redirect?: string;
  failedLogins?: number;
  authType?: string;
};

/** Account recovery method, including its type and masked destination. */
export type ResetTypeData = {
  content?: string;
  type?: string;
  nation?: string;
};

/** Captcha image bytes and session cookie needed to request an SMS code. */
export type CaptchaResult = {
  cookie: string;
  image: Uint8Array;
};

/** Successful SMS request with its response, supplied cookie, and request URL. */
export type SmsSendResult = {
  status: number;
  body: SsoResponse<SmsSendData>;
  cookie: string;
  url: string;
};

/** Successful SMS login response and the supplied session cookie. */
export type LoginResult = {
  status: number;
  body: SsoResponse<LoginData>;
  cookie: string;
};

/** Successful SMS recovery number match; an unmatched number causes an error. */
export type PhoneLast4AuthResult = {
  status: number;
  body: SelfcareResponse<ResetTypeData[] | null>;
  matched: true;
  url: string;
};

/** HTTP options shared by authentication operations. */
export type RequestOptions = {
  /** Override the default User-Agent request header. */
  userAgent?: string;
};

/** Account, captcha text, and session cookie for requesting an SMS code. */
export type SendSmsOptions = RequestOptions & {
  username: string;
  vcode: string;
  cookie: string;
  /** Cache-busting timestamp; defaults to `Date.now()`. */
  timestamp?: number;
};

/** Account, SMS verification code, and session cookie for completing login. */
export type LoginOptions = RequestOptions & {
  username: string;
  smsCode: string;
  cookie: string;
};

/** Account and phone suffix used to check the SMS recovery method. */
export type PhoneLast4AuthOptions = RequestOptions & {
  username: string;
  /** Exactly four decimal digits; surrounding whitespace is removed. */
  phoneLast4: string;
};
