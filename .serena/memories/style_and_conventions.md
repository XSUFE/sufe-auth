# Style and conventions

- Language: TypeScript with ES modules (`type: module`).
- TS config: strict mode enabled (`strict: true`), with `moduleResolution: bundler` and `noEmit: true`.
- Formatting via Prettier:
  - 2 spaces, semicolons enabled, double quotes, trailing commas `es5`, print width 80.
- Architecture conventions:
  - Keep `index.ts` as public barrel only.
  - Put reusable/shared logic in `core/`.
  - Put feature/auth flows in `methods/` as focused modules.
  - Keep demos under `examples/` and out of library core.
- API conventions:
  - Network functions return typed structured results.
  - HTTP and business-code failures are thrown as `LoginError`.
  - Success criterion for SUFE business response is explicit `code === "0"`.
- Naming:
  - Exports are descriptive and stable (`secondAuthByPhoneLast4`, alias `authByPhoneLast4`).
- Tests:
  - Bun test runner (`bun:test`), `globalThis.fetch` mocked for deterministic behavior.
