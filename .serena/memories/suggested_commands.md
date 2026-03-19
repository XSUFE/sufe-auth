# Suggested commands (Darwin/macOS)

## Install / setup

- `pnpm install`
- `bun install`

## Run entrypoints

- `bun run examples/script-demo.ts` (script demo)
- `bun run examples/html-demo/server.ts` (interactive demo at http://localhost:3000)
- `pnpm run dev` (formats then runs HTML demo server)

## Test

- `bun test`
- `bun test lib.test.ts`

## Typecheck

- `bunx tsc --noEmit`

## Format / checks

- `pnpm run format` (Prettier write)
- `pnpm run format:check` (Prettier check)

## Publish-related

- `pnpm run mock-publish` (format + JSR dry run)

## Useful local shell commands

- `git status`, `git diff`, `git log --oneline -n 10`
- `ls -la`, `cd <dir>`, `pwd`
- `rg <pattern>`, `rg --files`
- `find . -name "*.ts"`
- `sed -n '1,120p' <file>`, `cat <file>`
