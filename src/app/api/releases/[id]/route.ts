import { eq } from "drizzle-orm";
import { getActiveSession, getActorContext } from "@/lib/access-control";
import { db } from "@/lib/db";
import { appRelease } from "@/lib/db/schema";
import { updateReleaseSchema } from "@/lib/validations/release.schema";

/**
 * PUT /api/releases/[id]
 * Admin only. Edit a draft release.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = getActorContext(session.user);
  if (actor.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const parsed = updateReleaseSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await db.query.appRelease.findFirst({
      where: eq(appRelease.id, id),
    });

    if (!existing) {
      return Response.json({ error: "Release not found" }, { status: 404 });
    }

    if (existing.status === "published") {
      return Response.json(
        { error: "Cannot edit a published release" },
        { status: 409 },
      );
    }

    const [updated] = await db
      .update(appRelease)
      .set(parsed.data)
      .where(eq(appRelease.id, id))
      .returning();

    return Response.json({ release: updated });
  } catch (err) {
    console.error(`[PUT /api/releases/${id}]`, err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/releases/[id]
 * Admin only. Delete a draft release (cannot delete published).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = getActorContext(session.user);
  if (actor.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await db.query.appRelease.findFirst({
      where: eq(appRelease.id, id),
      columns: { id: true, status: true },
    });

    if (!existing) {
      return Response.json({ error: "Release not found" }, { status: 404 });
    }

    if (existing.status === "published") {
      return Response.json(
        { error: "Cannot delete a published release" },
        { status: 409 },
      );
    }

    await db.delete(appRelease).where(eq(appRelease.id, id));

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(`[DELETE /api/releases/${id}]`, err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
