# Jobtrace backend

Backend for a job application tracker: stores applications (company, role,
status, dates), Gmail messages linked to them, and users with email+password
auth. Standalone service — the frontend (React + Vite) lives in a separate
repo.

Stack: Node.js + TypeScript, Express, Prisma, PostgreSQL, zod, JWT + bcrypt.

## Requirements

- Node.js 20+
- Docker (for local Postgres) or your own PostgreSQL instance

## Setup

```bash
git clone <repo-url>
cd job-application-tracker-backend
cp .env.example .env
```

Fill in `.env` (see below for `JWT_SECRET` and Google credentials).

```bash
docker run --name jobtrace-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobtrace -p 5432:5432 -d postgres:16

npm install
npm run prisma:migrate
npm run dev
```

The server starts on `http://localhost:4000` (see `PORT` in `.env`).

## Endpoints

**Auth**
- `POST /auth/register` — register (email + password)
- `POST /auth/login` — login, returns a JWT
- `GET /auth/me` — current user's data (requires token)

**Jobs**
- `GET /jobs` — list the current user's applications
- `POST /jobs` — create an application
- `PATCH /jobs/:id` — update an application (owner only)
- `DELETE /jobs/:id` — delete an application (owner only)

**Responses**
- `GET /jobs/:jobId/responses` — emails linked to an application
- `POST /jobs/:jobId/responses` — add an email to an application
- `DELETE /responses/:id` — delete an email (application owner only)

**Gmail**
- `GET /gmail/connect` — returns the Google OAuth consent URL (requires token)
- `GET /gmail/callback` — Google's callback, exchanges the code for tokens
- `GET /gmail/token` — Gmail connection status

All endpoints except `/auth/register`, `/auth/login`, and `/gmail/callback`
require an `Authorization: Bearer <token>` header.

## Setting up Gmail OAuth (Google Cloud Console)

1. Create a project at console.cloud.google.com
2. Enable the Gmail API (APIs & Services → Library)
3. Configure the OAuth consent screen (External, add yourself as a test
   user while the app is unverified)
4. Create an OAuth 2.0 Client ID (Web application), redirect URI —
   `http://localhost:4000/gmail/callback`
5. Put the `Client ID` and `Client secret` into `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

## Deployment

Database: Neon (Postgres). Already set up — copy its connection string
into `DATABASE_URL` on Render.

Render (Web Service):
- Build command: `npm install && npm run build`
- Start command: `npm start` (runs `prisma migrate deploy` before starting
  the server, so migrations apply automatically on every deploy)
- Environment variables: `DATABASE_URL` (from Neon), `JWT_SECRET`,
  `FRONTEND_URL` (the deployed frontend's URL), `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (Render service URL +
  `/gmail/callback`). `PORT` is provided by Render.

After the first deploy, add a new redirect URI in Google Cloud Console
(OAuth 2.0 Client ID → Authorized redirect URIs) pointing at the real
Render domain, e.g. `https://<your-service>.onrender.com/gmail/callback`
— the `localhost` one only works for local development.
