import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { updatePersonSchema } from "@/lib/validations/people.schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "admin" && role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const payload = await req.json();
    const parsed = updatePersonSchema.safeParse(payload);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const targetUser = await db.query.user.findFirst({
      where: eq(userTable.id, id),
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (role === "manager") {
      if (targetUser.role === "admin") {
        return Response.json(
          { error: "Gerentes não podem alterar administradores." },
          { status: 403 },
        );
      }
      if (parsed.data.role === "admin") {
        return Response.json(
          { error: "Gerentes não podem promover para administrador." },
          { status: 403 },
        );
      }
    }

    const updated = await db
      .update(userTable)
      .set(parsed.data)
      .where(eq(userTable.id, id))
      .returning();

    return Response.json(updated[0], { status: 200 });
  } catch (err: unknown) {
    console.error("[PATCH /api/people/[id]]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "admin" && role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetUser = await db.query.user.findFirst({
      where: eq(userTable.id, id),
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (role === "manager" && targetUser.role === "admin") {
      return Response.json(
        { error: "Gerentes não podem excluir administradores." },
        { status: 403 },
      );
    }

    await db.delete(userTable).where(eq(userTable.id, id));

    return Response.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[DELETE /api/people/[id]]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
