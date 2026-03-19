# Task completion checklist

- Run formatting check: `pnpm run format:check`.
- If formatting changed or required: run `pnpm run format` and re-check.
- Run tests: `bun test` (or targeted `bun test lib.test.ts` during iteration, then full test run).
- For API behavior changes, ensure both success and failure paths remain covered (especially non-`0` business codes).
- If package metadata/exports changed, validate `jsr.json` and run `pnpm run mock-publish`.
- Update README/examples when public API behavior changes.
