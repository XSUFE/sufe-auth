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
  timestamp: string | number;
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

export type SendSmsOptions = RequestOptions & {
  username: string;
  vcode: string;
  cookie: string;
  timestamp?: number;
};

export type LoginOptions = RequestOptions & {
  username: string;
  smsCode: string;
  cookie: string;
};

export type PhoneLast4AuthOptions = RequestOptions & {
  username: string;
  phoneLast4: string;
};
