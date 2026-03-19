# Style and conventions

- Language: TypeScript (ES modules, `type: module`).
- TS strictness: `strict: true`, `noFallthroughCasesInSwitch: true`, `skipLibCheck: true`.
- Formatting via Prettier:
  - 2 spaces, semicolons on, double quotes, trailing commas `es5`, print width 80.
- Naming:
  - Exported constants/types/functions use clear descriptive camelCase/PascalCase.
  - Error class: `LoginError` for domain failures.
- API conventions:
  - Network calls return structured typed results.
  - HTTP failures and business-code failures are both surfaced as `LoginError`.
  - SSO success criterion is explicit: response `code` must equal `"0"`.
- Test conventions:
  - Bun test runner (`bun:test`), describe/test blocks grouped by feature (`sendSms`, `login`, etc.).
  - `globalThis.fetch` mocked for deterministic response behavior.
