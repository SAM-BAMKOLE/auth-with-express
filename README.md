# auth-express

Lightweight Express + TypeScript authentication starter using Prisma.

Contents

- Minimal JWT access + refresh token flows
- Prisma models and migrations
- Error and async middlewares

## Features

- TypeScript + Express app structure
- Prisma ORM (SQLite by default in schema) with `User` and `RefreshToken` models
- Global error handler middleware that returns JSON errors consistently
- Async route wrapper to forward rejected promises to the error handler
- Example token rotation/revocation pattern supported by the schema

## Quick start

Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm (or npm/yarn)

Clone and install

```powershell
cd C:\Users\HP\workspace
git clone <repo-url>
cd auth-express
pnpm install
```

Environment
Create a `.env` file at the project root. Example values:

```
DATABASE_URL="file:./dev.db"
PORT=3550
JWT_ACCESS_SECRET=your-long-secret
JWT_REFRESH_SECRET=another-long-secret
NODE_ENV=development
```

If you plan to use PostgreSQL in production, set `DATABASE_URL` accordingly (see Prisma docs).

Prisma

- Generate client and run migrations in development:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

Running the app

```powershell
pnpm dev
# or build + start
pnpm build; pnpm start
```

By default the app listens on `PORT` (defaults to 3550).

API overview

Health

- GET /health
  - Response: { status: 200, timestamp }

Auth (example routes under `/api/auth`)

- Register: POST /api/auth/register
  - Body: { email, password, name? }
- Login: POST /api/auth/login
  - Body: { email, password }
  - Response: { accessToken, refreshToken }
- Refresh: POST /api/auth/refresh
  - Body: { refreshToken }
  - Response: { accessToken, refreshToken }
- Logout: POST /api/auth/logout
  - Body: { refreshToken }

Implementation notes and best practices

- Refresh token storage

  - The project stores refresh tokens in the `RefreshToken` table. This allows token revocation and reuse detection. Multiple parallel refresh tokens per user are supported using `refreshTokens RefreshToken[]` on the `User` model.
  - Each token record contains `expiresAt` and an `invalidated` flag. On rotation, mark the old token `invalidated: true` and create a new token.
  - For improved security store a hash of the refresh token in the DB instead of the raw token.

- Token rotation and reuse detection

  - When a refresh token is used to get a new access token, invalidate the old refresh token and create a new one.
  - If an invalidated token is presented (reuse), revoke all tokens for that user and force re-login.

- Error handling

  - The global error handler `src/middlewares/errorHandler.ts` maps common errors (validation, Prisma, JWT) to appropriate HTTP codes and returns consistent JSON.
  - To ensure 404s are handled, register a 404-catching middleware after routes that calls `next(err)` with `statusCode = 404` so the `errorHandler` can format the response.

- Async routes
  - Use `src/middlewares/asyncHandler.ts` to wrap async route handlers so thrown errors are forwarded to the error handler.

Testing and development

- Run TypeScript checks

```powershell
pnpm tsc --noEmit
```

Next steps (recommended)

- Implement refresh token hashing and rotating on refresh
- Add rate limiting and brute-force protection on auth endpoints
- Add logging (Pino/Winston) and error reporting (Sentry)
- Add unit and integration tests (Jest / Supertest)

License

- MIT

## Examples (curl / PowerShell)

Below are quick copy-paste examples to exercise the common endpoints. Replace host/port if you've changed `PORT`.

Health

```bash
# curl (Linux/macOS, WSL)
curl -i http://localhost:3550/health
```

```powershell
# PowerShell (Windows)
Invoke-RestMethod -Uri http://localhost:3550/health
```

Register

```bash
curl -i -X POST http://localhost:3550/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"P@ssw0rd","name":"Alice"}'
```

```powershell
Invoke-RestMethod -Uri http://localhost:3550/api/auth/register -Method POST -Body (@{ email = 'alice@example.com'; password = 'P@ssw0rd'; name = 'Alice' } | ConvertTo-Json) -ContentType 'application/json'
```

Login

```bash
curl -i -X POST http://localhost:3550/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"P@ssw0rd"}'
```

```powershell
$resp = Invoke-RestMethod -Uri http://localhost:3550/api/auth/login -Method POST -Body (@{ email = 'alice@example.com'; password = 'P@ssw0rd' } | ConvertTo-Json) -ContentType 'application/json'
Write-Output $resp | ConvertTo-Json
```

Refresh

```bash
# Use the refreshToken value returned by login
curl -i -X POST http://localhost:3550/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN_HERE>"}'
```

```powershell
Invoke-RestMethod -Uri http://localhost:3550/api/auth/refresh -Method POST -Body (@{ refreshToken = '<REFRESH_TOKEN_HERE>' } | ConvertTo-Json) -ContentType 'application/json'
```

Logout

```bash
curl -i -X POST http://localhost:3550/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN_HERE>"}'
```

```powershell
Invoke-RestMethod -Uri http://localhost:3550/api/auth/logout -Method POST -Body (@{ refreshToken = '<REFRESH_TOKEN_HERE>' } | ConvertTo-Json) -ContentType 'application/json'
```
