<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Windows + Next.js 16 known issues

1. **Turbopack crashes on Windows** — Next.js 16 defaults to Turbopack, which causes `EBUSY` file-lock crashes on Windows. Always use `--webpack` flag: `next dev --webpack`.
2. **Clean `.next` cache** if you see silent crashes after switching bundlers: `Remove-Item -Recurse -Force .next`
3. **Production server (`next start`) hangs on dynamic pages** — this is caused by Node.js process crashes from `@prisma/adapter-pg` externalization. Fix: set `serverExternalPackages: []` (or omit it) in `next.config.ts` so Prisma packages are bundled.
4. **auth.js v5 `UntrustedHost` crash** — add `trustHost: true` to the `NextAuth()` config in `src/lib/auth.ts` to prevent unhandled rejections.
5. **Use `node --unhandled-rejections=warn`** before `next start` for better error visibility.
6. **Prisma client generation** — After any schema change, run `prisma generate` (already in `postinstall`). The generated client lives at `src/generated/prisma/`.
<!-- END:nextjs-agent-rules -->
