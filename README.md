# Vider(enjoy)

Vider(enjoy) is a Next.js application for static code intelligence, analysis, and guided coding assistance. The project includes:

- A code analysis engine that can inspect TypeScript, JavaScript, and Python snippets
- Server-side chat support using the OpenAI SDK when API keys are configured
- Safe Supabase configuration helpers without exposing service-role secrets to the browser
- A responsive web interface for code input and review

## Project structure

- `app/` — Next.js routes and front-end screens
- `lib/` — engine logic and service clients
- `supabase/` — database schema for message storage
- `tests/` — automated validation for static analysis behavior

## Requirements

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Environment variables

Create a local environment file based on `.env.example`:

```bash
cp .env.example .env.local
```

The following variables are supported:

- `OPENAI_API_KEY` — API key for chat features
- `OPENAI_MODEL` — model to use, for example `gpt-4o-mini`
- `SUPABASE_URL` — server-side Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role key (never expose this to client code)
- `NEXT_PUBLIC_SUPABASE_URL` — browser-safe Supabase URL if used in client code
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser-safe anonymous key if used in client code

Do not commit `.env.local` or other secret files.

## Development

```bash
npm run dev
```

Then open the browser on the local port shown by Next.js.

## Testing

```bash
npm test
```

The default test suite verifies empty input, malformed input, validation, security detection, and result shape consistency.

## Static checks

```bash
npm run lint
npm run typecheck
```

## Production build

```bash
npm run build
npm run start
```

## API endpoints

### GET `/api/health`

Returns application health metadata without checking external services.

Example response:

```json
{
  "ok": true,
  "status": "ok",
  "service": "vider-enjoy",
  "timestamp": "2026-10-26T00:00:00.000Z"
}
```

### POST `/api/engine`

Analyzes a supplied code snippet.

Example request body:

```json
{
  "language": "typescript",
  "code": "const value = 3;\nconsole.log(value);"
}
```

Example response:

```json
{
  "ok": true,
  "language": "typescript",
  "issues": [],
  "recommendations": ["No critical issues were detected by static heuristics in the supplied source."],
  "summary": {
    "totalIssues": 0,
    "severities": {
      "info": 0,
      "warning": 0,
      "error": 0,
      "security": 0
    }
  }
}
```

### POST `/api/chat`

Sends a coding question to OpenAI when the environment is configured.

Example request body:

```json
{
  "message": "Explain this TypeScript function and suggest a cleaner implementation.",
  "language": "typescript",
  "code": "const doubled = (value: number) => value * 2;"
}
```

If the API key is missing, the route responds with an explicit configuration error instead of failing the app.

## Current limitations

- The engine performs static heuristic analysis only; it does not execute code or claim to run an AST validator unless that tooling is added explicitly.
- Chat support depends on an OpenAI API key and a valid model.
- Supabase integration is intentionally configuration-gated and does not claim database connectivity without a real environment.
- The project is designed for safe local development and requires an explicit environment setup before external service features are used.

## Deployment and production notes

- Never deploy with secret-bearing `.env.local` files committed to source control.
- Review permissions and row-level security rules before enabling Supabase access in production.
- Ensure the OpenAI and Supabase keys are stored in a secure secret manager or deployment environment.
- Keep the application behind authentication and rate limits before public exposure.

## GitHub and remote safety

- Do not push to `main` without approval.
- Keep all code changes limited to the `vider-enjoy` repository.
- Do not remove or overwrite unrelated files without a clear reason.
