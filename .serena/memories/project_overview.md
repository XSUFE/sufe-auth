# sufe-auth project overview

- Purpose: TypeScript library for Shanghai University of Finance and Economics (SUFE) unified authentication via captcha + SMS login flow.
- Package target: Published as `@xsufe/sufe-auth` (JSR), exports `index.ts`.
- Primary runtime: Bun (examples/server/tests use Bun APIs).
- Main capabilities:
  - `getCaptcha()` fetches captcha image and session cookie
  - `sendSms()` sends SMS code request and validates SSO business code (`code === "0"`)
  - `login()` performs SMS login and validates SSO business code
  - `LoginError` provides domain-specific failure handling
- Codebase structure:
  - `index.ts`: library implementation, public types/functions/errors
  - `lib.test.ts`: bun tests for endpoint constants and business-code error behavior
  - `example.ts`: CLI-like demo script
  - `example-server.ts` + `example.html`: local interactive demo web flow
  - `utils.ts`: input helpers for local demo/testing
  - `jsr.json`: JSR package metadata (`exports: ./index.ts`)
  - `package.json`: scripts + dev tooling (Prettier)
  - `tsconfig.json`: strict TS config, ESNext + bundler resolution
