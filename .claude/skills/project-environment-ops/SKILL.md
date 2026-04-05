---
name: project-environment-ops
description: Operate and troubleshoot the OptSolv Time Tracker published environment end-to-end (GitHub + Azure DevOps repos, Azure Pipelines CI/CD, Azure Web App production service plan, Better Auth + Microsoft Entra App Registration, and Azure PostgreSQL). Use this skill whenever the user asks about deploys, environment variables, production incidents, auth callback/session failures, cron/automation, secrets, or safe changes in published environments.
---

# Project Environment Ops

Production-focused operating skill for the OptSolv Time Tracker.

This skill is for safe execution in published environments, not just local coding.

## When to activate

Activate this skill whenever the request mentions at least one of these contexts:

- deployment, rollback, release, hotfix, smoke test
- Azure Web App, Azure Portal, service plan, App Service config
- Azure Pipelines, CI/CD, pipeline failures, startup command
- environment variables, secret rotation, encryption key, cron secret
- Better Auth, Microsoft Entra, OAuth callback, session/login loops
- PostgreSQL availability, SSL, connection pool, migrations
- GitHub and Azure DevOps repository workflow coordination

## Required project context (read first)

Before proposing or applying changes, read these files to ground decisions:

1. `azure-pipelines.yml`
2. `.github/workflows/reminder-cron.yml`
3. `.env.example`
4. `next.config.ts`
5. `src/proxy.ts`
6. `src/lib/auth.ts`
7. `src/app/api/auth/[...all]/route.ts`
8. `src/lib/db/index.ts`
9. `drizzle.config.ts`

Then read `references/environment-map.md`.

## Environment map summary

- Runtime: Next.js 16.1.x with `output: "standalone"`
- Deploy target: Azure App Service Linux (`prd-opt-time`)
- CI/CD: Azure Pipelines (`azure-pipelines.yml`), build + deploy + smoke test
- Extra automation: GitHub Actions cron hitting `/api/cron/reminders`
- Auth: Better Auth + Microsoft provider (Entra App Registration)
- Data: Azure Database for PostgreSQL via `pg` + Drizzle

## Mandatory operating workflow

Follow this order every time you touch published environment behavior.

### 1) Impact framing

- Define scope: app code, infra config, auth config, db schema, or automation.
- Classify risk level: low / medium / high.
- Identify blast radius: who can be affected (all users, manager/admin only, specific routes).
- Identify rollback strategy before making changes.

### 2) Dependency and secret audit

- Verify all required env vars are present in target environment.
- Confirm `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` point to the same public app URL.
- Confirm Microsoft callback URL uses `/api/auth/callback/microsoft`.
- Confirm `ENCRYPTION_KEY` stability (must not change unexpectedly across deploys).
- Confirm `DATABASE_URL` SSL requirements are preserved.

### 3) Change plan

Produce a concise plan with:

- objective
- exact files and settings to modify
- verification commands and expected outputs
- rollback steps

### 4) Safe execution

- Prefer minimal, reversible changes.
- Never commit placeholders as real secrets.
- Never remove SSL safeguards for Azure PostgreSQL.
- Do not bypass auth validation for protected endpoints.

### 5) Validation gates

Run and report:

- build gate (`pnpm run build` or pipeline build)
- startup gate (App Service startup command intact)
- health gate (`GET /api/health`)
- auth gate (login + session retrieval)
- critical route gate (at least one protected API endpoint)
- cron gate (if change touches reminders/scheduler)

### 6) Rollback readiness

If any validation gate fails:

- stop rollout
- apply rollback plan
- verify `/api/health` and login path again
- document failure cause and next safe attempt

## Guardrails by domain

### CI/CD and Deploy

- Keep Node runtime and startup command aligned with pipeline and App Service config.
- Respect standalone output packaging assumptions.
- Preserve post-deploy smoke test on `/api/health`.

### Authentication

- Keep Better Auth mounted at `/api/auth/[...all]` in App Router.
- Keep session validation in route handlers/pages (not only at proxy boundary).
- Preserve allowed corporate domain logic in user creation flow.

### Database

- Keep SSL-aware connection behavior from `src/lib/db/index.ts`.
- Prefer Drizzle migrations for schema changes.
- Treat destructive schema operations as high risk and require explicit rollback.

### Scheduler and automation

- `CRON_SECRET` must be validated server-side for cron endpoints.
- External scheduler calls must target correct `APP_URL` and auth header.

## Response format for environment operations

When using this skill, structure output in this order:

1. Current environment understanding
2. Risk and blast radius
3. Planned change steps
4. Validation checklist
5. Rollback plan
6. Final status (done/blocked)

## Practical references

- `references/environment-map.md` for production topology and env var matrix.
