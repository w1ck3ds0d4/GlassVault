# GlassVault v1 Roadmap

## What v1 is

An intentionally vulnerable multi-tenant API used as evaluation infrastructure
for AI cybersecurity: incident investigation, pen-testing, secure
remediation, and log forensics. WARNING: do not deploy in production.
Express 5 + Apollo GraphQL + SQLite + React/Vite frontend. Catalogues 12
distinct vulnerabilities (VULN-001 through VULN-012) across default creds,
cross-tenant export, hardcoded secrets, prototype pollution, race
conditions, CSV injection, XSS, in-memory cache leaks, telemetry exfiltration.

## Current state

`package.json` marks v1.0.0 implying a stable API surface (intentionally
including the vulnerabilities). Express + TypeScript bootstrap, SQLite
multi-tenant schema with 30+ tenant seed generator, JWT + API key auth, REST
API surfaces (auth, projects, files, keys, promo, preferences, export,
admin), GraphQL on `/graphql`, audit logging, per-request JSON access log,
HMAC-SHA256 log signatures (`src/lib/log-integrity.ts`). React/Vite frontend
present. CI runs `tsc --noEmit` + `npm audit` (non-blocking). No tests.

## v1 acceptance criteria

- [x] Express 5 + Apollo GraphQL bootstrap
- [x] SQLite multi-tenant schema (30+ tenants from seed)
- [x] JWT + API key auth with documented weaknesses (VULN catalog)
- [x] REST surfaces: auth, projects, files, keys, promo, preferences, export, admin
- [x] GraphQL endpoint at `/graphql`
- [x] Audit logging + per-request JSON access log
- [x] HMAC-SHA256 log integrity signatures
- [x] 12 catalogued vulnerabilities (VULN-001 through VULN-012)
- [ ] Each VULN-XXX has a reproducer test in `tests/vuln/` (so the eval harness can verify the vuln is present and exploitable)
- [ ] Document classification fully implemented (`src/lib/document-classification.ts` finishes "partially implemented" work)
- [ ] CI is hard-gated (tsc + tests + npm audit blocking)
- [ ] Smoke test against GlassVault.tools' `setup_scenario.py` end-to-end
- [ ] Stable seed: re-running `npm run seed` produces deterministic tenants for reproducible evals
- [ ] README "do not deploy" warning surfaced in `/health` response too
- [ ] Tag `v1.0.0` after the smoke test confirms vuln catalog + scoring path are stable

## Milestones to v1

### M1. VULN reproducer suite (M)

- [ ] One reproducer per VULN-XXX under `tests/vuln/VULN-001.test.ts` etc
- [ ] Each test asserts: vulnerability present + exploitation succeeds + audit log records the attack
- [ ] Wire to `npm test`

**Acceptance:** running the suite confirms every catalogued vuln is reachable from a fresh seed.

### M2. Document classification completeness (S/M)

- [ ] Finish `src/lib/document-classification.ts` (today it's partially implemented)
- [ ] Tests covering each classification label
- [ ] Surface labels in the export endpoint

**Acceptance:** files coming out of `/export` carry consistent classification metadata.

### M3. Deterministic seed (S)

- [ ] Pin seed RNG to a published seed value
- [ ] Document how to override the seed for custom scenarios
- [ ] `npm run seed -- --check` returns 0 only when DB matches the canonical seed

**Acceptance:** GlassVault.tools' scenarios produce identical ground-truth across runs.

### M4. CI hardening (S)

- [ ] Make `tsc --noEmit` and `npm test` blocking
- [ ] Keep `npm audit` non-blocking (vulnerabilities are intentional)
- [ ] Add the vuln test suite to CI

**Acceptance:** every PR is gated; intentional vulns stay intentional but unintentional regressions break the build.

### M5. Smoke with GlassVault.tools + tag (S)

- [ ] Spin up GlassVault, run GlassVault.tools' `setup_scenario.py`, verify ground-truth manifest matches
- [ ] Run forensic verification chain end-to-end
- [ ] Tag `v1.0.0`

**Acceptance:** end-to-end eval scenario runs cleanly; tag pushed.

## Beyond v1 (post-1.0 polish)

- Additional VULN-XXX entries (current 12 is the baseline)
- Multi-region tenancy
- Time-travel debug mode (replay an attack from audit log)
- Public sample evaluation reports

## Out of scope for v1

- Patching the catalogued vulnerabilities (those ARE the product)
- Production deployment guides (it's a research target, not production-safe)
- AI evaluation runner itself — that lives in GlassVault.tools
