import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { project, projectMember } from "@/lib/db/schema";
import { projectSchema } from "@/lib/validations/project.schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/projects/[id]
 * Returns full project details. Members can only view projects they belong to.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const found = await db.query.project.findFirst({
      where: eq(project.id, id),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                department: true,
              },
            },
          },
        },
        manager: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!found) {
      return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    // Members can only view projects they belong to
    if (session.user.role === "member") {
      const isMember = found.members.some((m) => m.userId === session.user.id);
      if (!isMember) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return Response.json({ project: found });
  } catch (error) {
    console.error("[GET /api/projects/[id]]:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Updates a project. Restricted to manager / admin.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "manager" && session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = projectSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await db.query.project.findFirst({
      where: eq(project.id, id),
    });
    if (!existing) {
      return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    const data = parsed.data;
    const managerId = data.managerId || session.user.id;

    const [updated] = await db
      .update(project)
      .set({
        name: data.name,
        code: data.code,
        description: data.description || null,
        clientName: data.clientName || null,
        color: data.color,
        billable: data.billable,
        budget: data.budget || null,
        azureProjectId: data.azureProjectId || null,
        managerId,
      })
      .where(eq(project.id, id))
      .returning();

    // Sync members: clear and re-add
    await db.delete(projectMember).where(eq(projectMember.projectId, id));

    const memberSet = new Set([managerId, ...data.memberIds]);
    for (const userId of memberSet) {
      await db.insert(projectMember).values({
        id: crypto.randomUUID(),
        projectId: id,
        userId,
      });
    }

    return Response.json({ project: updated });
  } catch (error) {
    console.error("[PUT /api/projects/[id]]:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
