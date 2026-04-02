import { randomBytes } from "crypto";
import { z } from "zod";
import { getActiveSession, getActorContext } from "@/lib/access-control";
import { db } from "@/lib/db";
import { reminderSchedule } from "@/lib/db/schema";
import { updateScheduleSchema } from "@/lib/validations/reminder.schema";

async function getOrCreateSchedule(actorId: string) {
  const existing = await db.query.reminderSchedule.findFirst();
  if (existing) return existing;

  const id = randomBytes(16).toString("hex");
  const [created] = await db
    .insert(reminderSchedule)
    .values({
      id,
      createdById: actorId,
      enabled: false,
      daysOfWeek: [5], // Friday default
      hour: 16,
      minute: 0,
      timezone: "America/Sao_Paulo",
      condition: "not_submitted",
      targetScope: "direct_reports",
    })
    .returning();
  return created;
}

export async function GET(req: Request): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = getActorContext(session.user);
  if (actor.role !== "admin" && actor.role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const schedule = await getOrCreateSchedule(actor.userId);
    return Response.json(schedule);
  } catch (err) {
    console.error("[GET /api/notifications/schedule]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = getActorContext(session.user);
  if (actor.role !== "admin" && actor.role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Managers cannot set targetScope = "all"
  if (actor.role === "manager" && data.targetScope === "all") {
    return Response.json(
      { error: "Gerentes não podem selecionar escopo global" },
      { status: 403 },
    );
  }

  try {
    // Ensure record exists before updating
    await getOrCreateSchedule(actor.userId);

    const [updated] = await db
      .update(reminderSchedule)
      .set({
        enabled: data.enabled,
        daysOfWeek: data.daysOfWeek,
        hour: data.hour,
        minute: data.minute,
        timezone: data.timezone,
        condition: data.condition,
        targetScope: data.targetScope,
      })
      .returning();

    return Response.json(updated);
  } catch (err) {
    console.error("[PUT /api/notifications/schedule]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
