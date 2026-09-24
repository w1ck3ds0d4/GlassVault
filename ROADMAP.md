# Roadmap

**Status:** maintain. **Last reviewed:** 2026-09-24.

GlassVault is an intentionally vulnerable multi-tenant document/collaboration API, used as target
infrastructure for AI cybersecurity evaluation (12 catalogued VULN-XXX weaknesses). It is a
portfolio asset, not the paid product, so it stays frozen: "done" for now means CI stays green and
Dependabot alerts get triaged, not shipping the remaining v1 milestones (VULN reproducer suite,
scoring smoke test with GlassVault.tools).

> How this file is used: Claude Project threads build the first unticked item under **Now**, one item per branch and pull request, and tick it in that same PR as `- [x] ... (#PR)`. Daniel owns the order and the lists; threads never add to Now, Next or Later themselves, they propose under **Ideas**.

## Now

No new features without Daniel's go.

- [ ] **Triage the 11 open Dependabot alerts**: confirm each one sits in a build/tooling dependency and not in the catalogued VULN set, so an unintentional weakness is never mistaken for an intentional one. Done when: every open alert has a one-line disposition (patch, or "intentional, leave") recorded in the PR that resolves it.
- [ ] **Keep CI green**: watch `ci.yml` (`tsc --noEmit`, `npm audit`, both currently non-blocking) and `security.yml`. Done when: the last 5 runs on `main` are green.
- [ ] **Keep Dependabot patched**: merge routine dependency-bump PRs once their own CI passes, except where the bump would remove or defang a catalogued VULN. Done when: 0 open Dependabot alerts outside the ones marked intentional.

## Next

- [ ] **VULN reproducer suite (parked)**: one test per VULN-XXX under `tests/vuln/` asserting the weakness is present, exploitable, and logged. Done when: running the suite confirms every catalogued vuln is reachable from a fresh seed.
- [ ] **Smoke with GlassVault.tools (parked)**: spin up GlassVault, run GlassVault.tools' `setup_scenario.py`, verify the ground-truth manifest matches. Done when: the end-to-end eval scenario runs cleanly.

## Later

- Finish document classification (`src/lib/document-classification.ts` is partially implemented).
- Deterministic seed so `npm run seed` produces reproducible tenants across runs.
- CI hardening: make `tsc --noEmit` and tests blocking, keep `npm audit` non-blocking (the vulns are the product).
- Additional VULN-XXX entries beyond the current 12.
- Time-travel debug mode replaying an attack from the audit log.

## Ideas

(empty; threads add proposals here)

## Done

- [x] Express 5 + Apollo GraphQL bootstrap, SQLite multi-tenant schema (30+ seeded tenants)
- [x] JWT + API key auth with documented weaknesses (VULN catalog)
- [x] REST surfaces (auth, projects, files, keys, promo, preferences, export, admin) and a GraphQL endpoint at `/graphql`
- [x] Audit logging, per-request JSON access log, HMAC-SHA256 log integrity signatures
- [x] React/Vite frontend
- [x] Apollo Server v5 / Express 5 migration
- [x] License section normalized to plain-text dual-license form (#29)
