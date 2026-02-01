# CloudVault API

Multi-tenant document management and project collaboration API.

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## API Documentation

- REST API: `http://localhost:4000/api/`
- GraphQL: `http://localhost:4000/graphql`
- Health: `http://localhost:4000/health`

## Tech Stack

- Node.js + TypeScript
- Express.js
- Apollo Server (GraphQL)
- SQLite (better-sqlite3)
- JWT Authentication
