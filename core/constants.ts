export const SUFE_ENDPOINTS = {
  captcha: "https://login.sufe.edu.cn/esc-sso/api/v1/image/getRandcode",
  smsSend: "https://login.sufe.edu.cn/esc-sso/api/v3/sms/send",
  doLogin: "https://login.sufe.edu.cn/esc-sso/api/v3/auth/doLogin",
  resetType:
    "https://login.sufe.edu.cn/portal/rest/selfcare/home/password/resetType",
} as const;

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

export const SELFCARE_AES_KEY = "supporForTodoKey";
export const SELFCARE_AES_IV = "supporForTodo_Iv";
