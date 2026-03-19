import { afterEach, describe, expect, test } from "bun:test";
import {
  LoginError,
  SUFE_ENDPOINTS,
  authByPhoneLast4,
  login,
  secondAuthByPhoneLast4,
  sendSms,
} from ".";

const originalFetch = globalThis.fetch;

function mockJsonFetch(body: unknown, status = 200): typeof fetch {
  const mocked = (async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status })) as typeof fetch;
  mocked.preconnect = originalFetch.preconnect.bind(originalFetch);
  return mocked;
}

function mockFetch(
  fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
): typeof fetch {
  const mocked = (async (input: RequestInfo | URL, init?: RequestInit) =>
    fn(input, init)) as typeof fetch;
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

describe("authByPhoneLast4", () => {
  test("alias should behave like secondAuthByPhoneLast4", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "0",
      msg: "操作成功！",
      version: "1.0",
      timestamp: "1772460975665",
      data: [{ content: "186****6555", type: "SMS", nation: "0086" }],
    });

    const result = await authByPhoneLast4({
      username: "20220001",
      phoneLast4: "6555",
    });
    expect(result.matched).toBe(true);
  });
});

describe("secondAuthByPhoneLast4", () => {
  test("should pass when SMS masked phone matches last4", async () => {
    let capturedUrl = "";
    globalThis.fetch = mockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({
          code: "0",
          msg: "操作成功！",
          version: "1.0",
          timestamp: "1772460975665",
          data: [{ content: "186****6555", type: "SMS", nation: "0086" }],
        }),
        { status: 200 }
      );
    });

    const result = await secondAuthByPhoneLast4({
      username: "20220001",
      phoneLast4: "6555",
    });

    expect(result.body.code).toBe("0");
    expect(result.matched).toBe(true);
    expect(result.url).toContain(SUFE_ENDPOINTS.resetType);

    const encrypted = new URL(capturedUrl).searchParams.get("username");
    expect(encrypted).toBeTruthy();
    expect(encrypted).toBe("0sgZEe4P5Rs7DOGlVD+zdg==");
  });

  test("should fail when phone last4 does not match", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "0",
      msg: "操作成功！",
      version: "1.0",
      timestamp: "1772460975665",
      data: [{ content: "186****6555", type: "SMS", nation: "0086" }],
    });

    await expect(
      secondAuthByPhoneLast4({
        username: "20220001",
        phoneLast4: "1234",
      })
    ).rejects.toThrow("备用认证失败: 手机号后四位不匹配");
  });

  test("should fail when username does not exist", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "SELFCARESECURITYLIST-GET-001",
      msg: "获取用户的密码找回方式失败",
      version: "1.0",
      timestamp: "1772460975665",
      data: null,
    });

    await expect(
      secondAuthByPhoneLast4({
        username: "not-exists",
        phoneLast4: "6555",
      })
    ).rejects.toThrow(
      "备用认证失败(SELFCARESECURITYLIST-GET-001): 获取用户的密码找回方式失败"
    );
  });

  test("should fail when timestamp is missing", async () => {
    globalThis.fetch = mockJsonFetch({
      code: "0",
      msg: "操作成功！",
      version: "1.0",
      data: [{ content: "186****6555", type: "SMS", nation: "0086" }],
    });

    await expect(
      secondAuthByPhoneLast4({
        username: "20220001",
        phoneLast4: "6555",
      })
    ).rejects.toThrow("备用认证失败: 缺少或无效 timestamp");
  });
});
