export { SUFE_ENDPOINTS } from "./core/constants";
export { LoginError } from "./core/errors";

export type {
  CaptchaResult,
  LoginData,
  LoginOptions,
  LoginResult,
  PhoneLast4AuthOptions,
  PhoneLast4AuthResult,
  RequestOptions,
  ResetTypeData,
  SelfcareResponse,
  SendSmsOptions,
  SmsSendData,
  SmsSendResult,
  SsoResponse,
} from "./core/types";

export { getCaptcha } from "./methods/getCaptcha";
export { login } from "./methods/login";
export { secondAuthByPhoneLast4 } from "./methods/secondAuthByPhoneLast4";
export { sendSms } from "./methods/sendSms";

// Backward-compatible alias.
export { secondAuthByPhoneLast4 as authByPhoneLast4 } from "./methods/secondAuthByPhoneLast4";
