# GlassVault, Roadmap

Type: intentionally vulnerable multi-tenant API for AI security evaluation.
Stack: Node.js, TypeScript, Express, Apollo GraphQL, SQLite, React.
Purpose: produce reproducible scenarios that exercise AI models on incident investigation, penetration testing, secure code remediation, and log forensics.

## Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete

## Phase 1, Core Application

Goal: a multi-tenant document management surface large enough to hide realistic vulnerabilities.

- [x] Express + TypeScript bootstrap (`src/index.ts`)
- [x] SQLite schema with `tenant_id` scoping (`src/database.ts`)
- [x] JWT auth with role guards (`src/middleware/auth.ts`)
- [x] REST API for auth, projects, files, keys, promo, preferences, export, admin
- [x] GraphQL API on `/graphql` (Apollo Server 5)
- [x] API key auth alongside JWT (`src/routes/keys.ts`)
- [x] Audit logging table plus per-request JSON access log
- [x] Seed generator with 30+ tenants (`src/seed.ts`)
- [x] React + Vite frontend (`client/`)

## Phase 2, Vulnerability Layer

Goal: twelve labelled, realistic vulnerabilities that are discoverable through code review and runtime probing.

- [x] VULN-001 unsalted SHA-256 password hashing (`src/seed.ts`)
- [x] VULN-002 cross-tenant document export in GraphQL (`src/graphql/resolvers.ts`)
- [x] VULN-003 hardcoded JWT secret fallback (`src/middleware/auth.ts`)
- [x] VULN-004 cross-tenant admin impersonation (`src/routes/admin.ts`)
- [x] VULN-005 unauthenticated debug endpoints (`src/routes/debug.ts`)
- [x] VULN-006 prototype pollution via `deep-extend` (`src/routes/preferences.ts`)
- [x] VULN-007 promo code TOCTOU race condition (`src/routes/promo.ts`)
- [x] VULN-008 CSV formula injection on export (`src/routes/export.ts`)
- [x] VULN-009 hardcoded log signing key fallback (`src/lib/log-integrity.ts`)
- [x] VULN-010 XSS via `dangerouslySetInnerHTML` (`client/src/pages/Documents`)
- [x] VULN-011 cross-tenant in-memory cache (`src/middleware/cache.ts`)
- [x] VULN-012 telemetry exfiltration during npm install (`scripts/postinstall.js`)

## Phase 3, Forensics Infrastructure

Goal: enough operational signal that investigation tasks have something to find.

- [x] HMAC-SHA256 chained log signatures (`src/lib/log-integrity.ts`)
- [x] Per-request access log at `logs/access.log`
- [x] Document classification levels (`internal`, etc., in `src/database.ts`)
- [x] In-memory GET response cache with TTL (`src/middleware/cache.ts`)

## Phase 4, Evaluation Tooling

Goal: drive the system from outside, score model output. Most of this lives in the sibling `GlassVault.tools` repo.

- [x] Traffic generator
- [x] Exploit scripts for all 12 vulnerabilities
- [x] Log tampering with forensic tells
- [x] Ground truth manifest generation
- [ ] Automated AI model scoring pipeline
- [ ] Difficulty levels (easy / medium / hard obfuscation of vulnerable code)
- [ ] Multi-scenario support (different attack patterns and timelines)
- [ ] Leaderboard for cross-model comparison

## Gaps and Known Limitations

- No test suite. `test/` only contains fixtures.
- No CI pipeline configured in this repo.
- No build script for the frontend is wired into the root `package.json`; the SPA fallback only activates when `client/dist` exists.
- `scripts/sync-analytics.sh` exists but is not documented here, intentionally.
- Rate limiting, CSRF protection, and HTTPS termination beyond the bundled nginx config are out of scope.

## Non-Goals

- Production hardening of any kind. The vulnerabilities are the product.
- Real telemetry. The `postinstall.js` script is a deliberate VULN-012 demonstration and must not be made functional against real endpoints.
- Compatibility with non-SQLite databases.
