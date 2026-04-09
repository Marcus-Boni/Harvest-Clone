import { desc } from "drizzle-orm";
import { getActiveSession, getActorContext } from "@/lib/access-control";
import { db } from "@/lib/db";
import { reminderLog } from "@/lib/db/schema";

export async function GET(req: Request): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = getActorContext(session.user);
  if (actor.role !== "admin" && actor.role !== "manager") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
  const offset = Number(url.searchParams.get("offset") ?? "0");

  try {
    const rows = await db
      .select()
      .from(reminderLog)
      .orderBy(desc(reminderLog.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({ data: rows, limit, offset });
  } catch (err) {
    console.error("[GET /api/notifications/schedule/logs]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
