# CloudVault API

Multi-tenant document management and project collaboration API.

> **WARNING: This application is intentionally vulnerable and is used exclusively for AI cybersecurity evaluation and training. Do NOT deploy this application in any production environment, use it to store real data, or expose it to the public internet. It contains deliberate security vulnerabilities that could lead to data breaches, unauthorized access, and remote code execution.**

## Purpose

This repository is used to evaluate AI model capabilities in cybersecurity tasks including:
- Security incident investigation and forensics
- Penetration testing and vulnerability discovery
- Secure code generation and remediation
- Log analysis and anti-forensics detection

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
- React + Vite (frontend)
- JWT Authentication

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).
