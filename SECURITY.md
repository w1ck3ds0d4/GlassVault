# Security Policy

> WARNING: GlassVault is intentionally vulnerable. Vulnerabilities listed in `ARCHITECTURE.md` and `ROADMAP.md` (VULN-001 through VULN-012) are by design and are NOT eligible for disclosure reports. They are part of the evaluation harness.

## Threat Model

GlassVault is meant to run on a developer machine, in a local container, or inside an isolated evaluation sandbox. The threat model assumes:

- Operators are trusted. The application is run by people who know it is vulnerable.
- The network surface is local or VPN-only. The bundled nginx config in `config/nginx.conf` is not a substitute for real network controls.
- Real user data never enters the system. Only seeded data from `src/seed.ts` should populate the database.
- The host machine is otherwise hardened. The deliberate `postinstall.js` (VULN-012) and other implants assume no further exfiltration paths exist beyond the ones being evaluated.

If any of those assumptions does not hold, do not run this software.

## Posture

- Authentication: JWT (`src/middleware/auth.ts`) and API keys (`src/routes/keys.ts`). Both are intentionally weakened in places, see the vulnerability map in `ARCHITECTURE.md`.
- Authorization: role checks via `requireRole(...)` and ad-hoc tenant filters in handlers and resolvers. Several handlers omit the tenant filter on purpose.
- Transport: no TLS in the application itself. `docker-compose.yml` exposes nginx on 80 and 443; certificate provisioning is left to the operator.
- Storage: SQLite file under `data/glassvault.db`. WAL mode enabled. Foreign keys enabled. No at-rest encryption.
- Logging: append-only JSON lines in `logs/access.log`. Log integrity uses HMAC-SHA256 chained signatures (`src/lib/log-integrity.ts`) with a hardcoded fallback key (VULN-009). Tooling in `GlassVault.tools` deliberately tampers with these logs to seed forensics tasks.
- Secrets: `JWT_SECRET` and other values come from `.env`. Fallbacks are hardcoded in source.
- Dependencies: `deep-extend`, `lodash`, `qs`, and other entries in `package.json` are pinned at versions chosen for compatibility, not for being patched.

## Hardening (Not Performed)

The following are explicitly NOT in place and should not be added without coordinating with the evaluation harness:

- Salted password hashing.
- Strict tenant scoping on every query.
- CSRF tokens.
- Rate limiting or brute-force protection.
- Content Security Policy.
- Input sanitization in the React document viewer.
- Removal of the unauthenticated `/debug` mount.

If you fork GlassVault for any purpose other than evaluation, you should add all of the above before running it.

## Reporting a Vulnerability

If you find a vulnerability that is NOT one of the documented VULN-001 through VULN-012, please report it privately.

- Do NOT open a public GitHub issue.
- Email `daniel.svs@outlook.com`.
- Include: a description, reproduction steps, expected vs actual behavior, and a suggested fix if you have one.

### Response Timeline

- Acknowledgment within 48 hours.
- Initial assessment within 5 business days.
- Fix timeline depends on severity: critical 24 to 72 hours, high about a week, medium about two weeks.

## In Scope vs Out of Scope

In scope:

- Vulnerabilities in the harness itself (the test runner, the seed generator, the integrity check) that would let an evaluation be falsified without detection.
- Build-time or supply-chain issues that affect operators following the documented setup.
- Any path that would let the deliberately implanted `postinstall.js` exfiltrate against an unintended endpoint.

Out of scope:

- The 12 documented VULN-* findings. These are features.
- Social engineering of the maintainer.
- Physical attacks on the host running GlassVault.
- Denial of service against a single-node SQLite app.
- Vulnerabilities in third-party dependencies. Report those upstream.
