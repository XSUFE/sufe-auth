import { SUFE_ENDPOINTS } from "../core/constants";
import {
  encryptSelfcareUsername,
  isPhoneLast4Matched,
  normalizePhoneLast4,
} from "../core/crypto";
import { LoginError } from "../core/errors";
import {
  assertSuccess,
  createBaseHeaders,
  errorDetail,
  isRecord,
  parseJsonResponse,
  parseSelfcareResponse,
} from "../core/http";
import type {
  PhoneLast4AuthOptions,
  PhoneLast4AuthResult,
  ResetTypeData,
} from "../core/types";

/**
 * Check whether an account's SMS recovery number ends in the given four digits.
 * The username is encrypted before requesting the account's recovery methods.
 * This operation does not perform the captcha and SMS login flow.
 *
 * @param options Account username, four phone digits, and HTTP overrides.
 * @returns The successful self-care response, request URL, and `matched: true`.
 * @throws {LoginError} If input, encryption, service, or phone matching fails.
 */
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
  assertSuccess(parsed, "备用认证");

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
