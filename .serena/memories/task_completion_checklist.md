# Task completion checklist

- Run formatting check: `pnpm run format:check`.
- If needed, run formatter: `pnpm run format` and re-check.
- Run tests: `bun test` (or `bun test lib.test.ts` while iterating).
- Run typecheck for refactors/import moves: `bunx tsc --noEmit`.
- For API changes, ensure success and failure paths are tested (especially non-`0` business codes and second auth matching rules).
- If package metadata/exports changed, validate `jsr.json` and run `pnpm run mock-publish`.
- Update README and demos when public API behavior or project layout changes.
