# GlassVault

An intentionally vulnerable multi-tenant document/collaboration API: Express 5 + Apollo GraphQL +
SQLite backend, React/Vite frontend. Catalogues 12 disclosed weaknesses (VULN-001 through
VULN-012) as target infrastructure for AI cybersecurity evaluation. Do not deploy this in
production; see the warning in `README.md`.

## Commands

```bash
npm install
npm run seed          # generates the multi-tenant SQLite database
npm run dev           # tsx watch src/index.ts
npm run build         # tsc
npx tsc --noEmit --skipLibCheck   # what ci.yml runs (non-blocking today)
npm audit --audit-level=high      # what ci.yml runs (non-blocking today)

cd client
npm install
npm run dev           # vite dev server for the frontend
npm run build          # tsc -b && vite build
npm run lint            # eslint .
```

CI (`ci.yml`) runs the backend typecheck and `npm audit`, both `continue-on-error: true`. There is
no test suite yet.

## Layout

| Path | What it is |
| --- | --- |
| `src/index.ts` | Express app entry point |
| `src/graphql/` | Apollo GraphQL schema and resolvers |
| `src/routes/` | REST surfaces (auth, projects, files, keys, promo, preferences, export, admin) |
| `src/middleware/` | Auth, logging, and other Express middleware |
| `src/lib/` | Shared library code, including `log-integrity.ts` (HMAC-SHA256 log signing) and
  `document-classification.ts` |
| `src/database.ts` | SQLite connection and schema |
| `src/seed.ts` | Multi-tenant seed generator (`npm run seed`) |
| `client/` | React/Vite frontend, its own `package.json` and lint config |
| `config/` | Runtime configuration |
| `logs/`, `data/` | Generated at runtime; not checked in |

## Conventions

- Commits: `(type) lowercase summary`, no trailing period, no body. Types: `feat`, `fix`, `chore`,
  `docs`, `refactor`.
- ASCII hyphens only, no em dashes or en dashes anywhere.
- Feature branch per change, PR per branch; do not push to `main` directly.
- Status is **maintain** (see `ROADMAP.md`): no new feature work without Daniel's go, keep CI and
  Dependabot green, and never patch away a catalogued VULN-XXX weakness as if it were a bug.

## Do not read

`node_modules/`, `client/node_modules/`, `package-lock.json`, `client/package-lock.json`,
`data/` and `logs/` (generated at runtime, gitignored), `dist/`.
