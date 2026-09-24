# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No version has been
tagged yet; `package.json` carries `1.0.0` to imply a stable API surface,
including the intentional vulnerabilities.

## Unreleased

### Changed

- Apollo Server v5 / Express 5 migration
- License section normalized to plain-text dual-license form (#29)
- Package license declared in the manifest
- Routine dependency bumps across the backend and `client/` (React Router, TypeScript, GraphQL,
  better-sqlite3, and others)

### Added

- Express 5 + Apollo GraphQL bootstrap with SQLite multi-tenant schema
- JWT + API key auth, REST surfaces (auth, projects, files, keys, promo, preferences, export, admin),
  and a GraphQL endpoint at `/graphql`
- Audit logging, per-request JSON access log, and HMAC-SHA256 log integrity signatures
- React/Vite frontend
- CI (`ci.yml`) running a TypeScript typecheck and `npm audit`; CodeQL scanning (`security.yml`)
