# Authentication foundation — 2026-11-23

Branch: `codex/auth-security-foundation`, based on `e91975e`.

## Implemented locally

- Customer and technician OTP forms use Supabase Auth `signInWithOtp` / `verifyOtp`.
- Verification requires a provider session and a user whose phone matches the verified number.
- Egyptian mobile validation accepts local, international and Arabic-digit inputs; OTP input uses six digits.
- Changing the selected account or phone after sending an OTP cannot verify the newly selected phone using the previous challenge.
- Removed server-side Math.random OTP generation, console SMS fallback and boolean-only verification endpoints. Old endpoints return 410 so older clients must upgrade.
- New technicians are no longer marked document-verified automatically.
- Account switching requests local Supabase sign-out.

## Validation

- 18 new unit tests passed, using mocked Supabase responses; no live SMS sent.
- All 32 tests passed across five files.
- TypeScript passed. Lint returned zero errors and 32 warnings in existing application code.
- Vite client build succeeded. Full npm build failed at esbuild server bundling with filesystem access denied while traversing a parent directory. Server build has not been verified.

## Not ready to deploy

This is one stage, NOT a completed authorization migration. The existing local customer/technician records, role selection, session restoration, WebSocket global synchronization, admin authorization, database ownership columns and permissive RLS still need replacement. A Supabase session does not make those paths safe. Do not publish this branch or collect real identity documents yet.

Before a real OTP test, configure Phone Auth, SMS provider credentials, rate limits and a six-digit OTP in the intended Supabase test project. Never put SMS secrets or the Supabase secret key in VITE variables. No provider settings or production database settings were modified during this stage.

Next: use provider user IDs as durable ownership, replace account-list login with phone lookup after authentication, validate JWTs on protected API operations, replace global array sync with scoped operations, apply tested RLS migrations, and test two independent users for isolation.

## Second implementation stage

- Added server `requireIdentity` middleware: validates bearer tokens using Supabase `getUser`, rejects anonymous users, returns 401 on invalid credentials and fails closed on verification outages. No role or identity is accepted from the request body.
- Added `/api/auth/me` and protected both AI endpoints with this middleware. The two corresponding frontend callers now attach the Supabase session token using a same-origin-only helper that rejects redirects.
- Added an unapplied, additive SQL migration for user ownership columns, foreign keys and indexes. It does not backfill rows or replace permissive RLS, and has NOT been executed/tested against PostgreSQL. Do not apply it as a standalone production security fix.
- All 46 tests passed across seven suites, including HTTP-level middleware tests with a mocked identity verifier and token-forwarding tests. TypeScript passed after these changes. Live Supabase token verification, SMS delivery and database migrations remain untested.
- Existing WebSocket synchronization and admin authorization remain unsafe and unchanged; these are still release blockers. No deployment or live database modification was performed.

## Third implementation stage: contain legacy synchronization

- The legacy `/ws` full-state transport now refuses connections by default, including production even if its demo flag is accidentally set.
- An explicit development-only flag permits loopback connections from the same local HTTP origin, only when no Supabase admin secret is configured. The demo server binds to 127.0.0.1. Synthetic demo data only; no production use.
- Normal startup no longer loads the global database snapshot. Production frontend no longer attempts to connect to this legacy transport. Arbitrary realtime URL overrides were removed.
- This deliberately pauses cross-device legacy synchronization. It does NOT implement the replacement scoped request/chat/location transport, and must not be represented as working live synchronization.
- All 58 tests passed, including a real local WebSocket handshake rejected with HTTP 403. These tests do not prove production deployment security. Supabase RLS remains permissive in the live project and still needs coordinated replacement. Admin authorization also remains a release blocker.

## Fourth implementation stage: scoped request reads

- Added `GET /api/customer/requests` and `GET /api/customer/requests/:id` behind verified Supabase authentication.
- Server queries explicitly filter `customer_user_id` using the verified user ID. Request/query parameters cannot override ownership. Lists return at most 100 recent records and only an explicit column projection.
- Missing/non-owned records receive the same 404. Database failures receive 503 instead of a misleading successful empty list; internal errors are not returned.
- 64 tests passed across nine suites; TypeScript passed. New HTTP tests mock the repository and verifier, so actual database/RLS isolation is still unverified.
- These endpoints require the ownership migration and trustworthy ownership backfill. They are not yet wired to the customer UI, and do not create or update requests. No live database changes or deployment occurred.

References: https://supabase.com/docs/reference/javascript/auth-signinwithotp and https://supabase.com/docs/reference/javascript/auth-verifyotp
