import { afterEach, describe, expect, test } from "bun:test";
import { LoginError, SUFE_ENDPOINTS, login, sendSms } from ".";

const originalFetch = globalThis.fetch;

function mockJsonFetch(body: unknown, status = 200): typeof fetch {
  const mocked = (async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status })) as typeof fetch;
  mocked.preconnect = originalFetch.preconnect.bind(originalFetch);
  return mocked;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("sufe endpoints", () => {
  test("should point to sufe login service", () => {
    expect(SUFE_ENDPOINTS.captcha).toContain("login.sufe.edu.cn");
    expect(SUFE_ENDPOINTS.smsSend).toContain("/api/v3/sms/send");
    expect(SUFE_ENDPOINTS.doLogin).toContain("/api/v3/auth/doLogin");
  });
});

describe("sendSms", () => {
  test("should pass when code is 0", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "0",
      msg: "ok",
      timestamp: 1771727069176,
      data: 60,
    });

    const result = await sendSms({
      username: "20220001",
      vcode: "abcd",
      cookie: "JSESSIONID=test",
      timestamp: 1771727069176,
    });

    expect(result.body.code).toBe("0");
    expect(result.body.msg).toBe("ok");
    expect(result.body.data).toBe(60);
  });

  test("should throw when code is not 0", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "ESSO000004",
      msg: "图形验证码校验失败",
      timestamp: 1771727276741,
      data: "true",
    });

    await expect(
      sendSms({
        username: "20220001",
        vcode: "wrong",
        cookie: "JSESSIONID=test",
      })
    ).rejects.toThrow("发送短信失败(ESSO000004): 图形验证码校验失败");
  });
});

describe("login", () => {
  test("should pass when code is 0", async () => {
    globalThis.fetch = mockJsonFetch({
      data: {
        redirect: "/esc-sso/login",
        failedLogins: 0,
      },
      code: "0",
      msg: "success",
      timestamp: 1771727078064,
    });

    const result = await login({
      username: "20220001",
      smsCode: "123456",
      cookie: "JSESSIONID=test",
    });

    expect(result.body.code).toBe("0");
    expect(result.body.data.failedLogins).toBe(0);
  });

  test("should throw when sms code is wrong", async () => {
    globalThis.fetch = mockJsonFetch({
      data: {
        redirect: "/esc-sso/login",
        failedLogins: 1,
        authType: "webSmsAuth",
      },
      code: "SSO10010",
      msg: "验证码错误，还有4次输入",
      timestamp: 1771727307777,
    });

    await expect(
      login({
        username: "20220001",
        smsCode: "000000",
        cookie: "JSESSIONID=test",
      })
    ).rejects.toThrow("登录失败(SSO10010): 验证码错误，还有4次输入");
  });
});

describe("login error", () => {
  test("should keep error name", () => {
    const error = new LoginError("test");
    expect(error.name).toBe("LoginError");
    expect(error).toBeInstanceOf(Error);
  });
});
