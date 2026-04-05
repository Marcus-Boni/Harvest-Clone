# CLAUDE.md - API Folder (Next.js 16 App Router)

This guide applies to all handlers under `src/app/api/**/route.ts`.

## Scope and routing model

- This project uses Next.js App Router route handlers, not legacy `pages/api`.
- A route handler must be implemented in `route.ts` with named HTTP exports (`GET`, `POST`, `PATCH`, `DELETE`, etc.).
- Do not create `page.tsx` at the same segment level as `route.ts`.

## Mandatory implementation pattern

Use this sequence in every protected endpoint:

1. Authenticate session with `getActiveSession(req.headers)`.
2. Return `401` when session is missing.
3. Build actor context with `getActorContext(session.user)` when role/scoping is needed.
4. Validate input with Zod `safeParse` before DB writes.
5. Enforce role/project/user scope checks with access-control helpers.
6. Execute DB operation with Drizzle.
7. Return `Response.json(...)` with explicit status when needed.
8. Catch errors, log with route prefix, return `500` generic error.

## Authorization helpers (prefer existing)

Use helpers from `src/lib/access-control.ts` instead of ad-hoc rules:

- `getActiveSession`
- `getActorContext`
- `canAccessProject`
- `canManageProject`
- `canManageUser`
- `getAccessibleProjectIds`
- `ensureManagerAssignableUsers`

## Validation and response conventions

- Use Zod schemas from `src/lib/validations`.
- Use `safeParse` and return `400` with structured details on invalid input.
- Recommended status usage:
  - `200` for successful reads/updates
  - `201` for successful creates
  - `400` invalid request payload or params
  - `401` missing/invalid auth
  - `403` forbidden by role/scope
  - `404` not found
  - `409` business lock/conflict (for example locked timesheet periods)
  - `500` internal server error

## Error handling standard

- Always wrap handler body in `try/catch` when non-trivial.
- Log using route signature format, for example:
  - `[GET /api/time-entries]:`
  - `[POST /api/projects]:`
- Never leak secrets, tokens, PATs, stack traces, or raw SQL errors in API responses.

## Database and data safety rules

- Use Drizzle (`db`) and schema models from `src/lib/db/schema`.
- Respect soft-delete behavior (`deletedAt`) where applicable.
- Preserve transactional integrity with `db.transaction(...)` for multi-step writes.
- Keep Azure PostgreSQL SSL behavior intact (defined in `src/lib/db/index.ts`).

## Auth and identity specifics

- Better Auth endpoint is mounted at `src/app/api/auth/[...all]/route.ts`.
- Keep this mount stable unless a full migration plan exists.
- Session checks in API routes are required even when `src/proxy.ts` already redirects pages.

## Integration and automation endpoints

- Cron endpoints must validate `Authorization: Bearer <CRON_SECRET>`.
- Extension endpoints under `/api/extension/*` rely on CORS headers from `next.config.ts`; do not break that contract.
- Azure DevOps sync side effects should remain async/non-blocking when already designed as fire-and-forget.

## Performance and runtime notes

- Keep route handlers lean; move complex domain logic to `src/lib/*`.
- Avoid unnecessary external calls inside critical read endpoints.
- Prefer pagination/limits for list endpoints when payload can grow.

## Minimal route template

Use this structure when adding a new protected endpoint:

```ts
import { getActiveSession, getActorContext } from "@/lib/access-control";

export async function POST(req: Request): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const actor = getActorContext(session.user);
    const body = await req.json();
    // validate + authorize + execute

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/example]:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

## Done criteria for API changes

Before finishing an API task:

1. Endpoint returns expected status codes for happy path and auth failures.
2. Input validation is explicit and tested manually with invalid payload.
3. Access-control behavior is verified for at least one restricted role.
4. No secret values are exposed in responses or logs.
5. `pnpm run build` passes.
