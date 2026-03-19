# sufe-auth

Shanghai University of Finance and Economics unified authentication SDK.

## Install

```sh
# pnpm
pnpm dlx jsr add @xsufe/sufe-auth
# bun
bunx jsr add @xsufe/sufe-auth
```

See [jsr.io/@xsufe/sufe-auth](https://jsr.io/@xsufe/sufe-auth).

## Usage (Script)

```ts
import { getCaptcha, sendSms, login } from "@xsufe/sufe-auth";

const username = "your_username";

const { cookie, image } = await getCaptcha();
await Bun.write("captcha.png", image);
console.log("Captcha image saved to captcha.png");

const vcode = prompt("Enter captcha text") ?? "";
const sms = await sendSms({ username, vcode, cookie });
console.log(sms.body); // success: { code: "0", msg: "ok", data: 60, ... }

const smsCode = prompt("Enter SMS code") ?? "";
const result = await login({ username, smsCode, cookie });
console.log(result.body); // success: { code: "0", msg: "success", data: {...}, ... }
```

Local runnable script demo:

```sh
bun run examples/script-demo.ts
```

`sendSms` and `login` now validate business response codes:

- `code === "0"` is treated as success
- any other `code` throws `LoginError`, for example:
  - `ESSO000004` captcha validation failed
  - `SSO10010` SMS code incorrect

## Second Auth Method (Phone Last 4)

Use this as the second auth method, separate from captcha+SMS login:

```ts
import { secondAuthByPhoneLast4 } from "@xsufe/sufe-auth";

await secondAuthByPhoneLast4({
  username: "your_username",
  phoneLast4: "6555",
});
```

Behavior:

- username is AES-CBC encrypted before calling SUFE resetType API
- API `code !== "0"` throws `LoginError`
- if no SMS method matches the provided last-4 digits, throws `LoginError`

## Usage (HTML Demo)

This repository includes an interactive page: `examples/html-demo/index.html`.

Start the local demo server:

```sh
bun run examples/html-demo/server.ts
```

Then open: `http://localhost:3000`

Method 1 flow:

1. Fetch and display captcha image
2. Enter captcha text and send SMS code
3. Enter SMS code and log in

Method 2 flow:

1. Enter username (second auth section)
2. Enter phone last-4 digits
3. Verify username + phone last-4

## Project Structure

- `index.ts`: public SDK entry (barrel exports)
- `core/`: shared constants, types, errors, http/crypto helpers
- `methods/`: auth method implementations (`getCaptcha`, `sendSms`, `login`, `secondAuthByPhoneLast4`)
- `examples/`: runnable demos (`script-demo.ts`, `html-demo/`)
- `lib.test.ts`: Bun unit tests
