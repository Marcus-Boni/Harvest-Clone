import { getActiveSession } from "@/lib/access-control";
import { getWeeklyTimesheetStatusForDate } from "@/lib/time-entry-locks";

export async function GET(req: Request): Promise<Response> {
  const session = await getActiveSession(req.headers);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Parâmetro date inválido. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const status = await getWeeklyTimesheetStatusForDate(session.user.id, date);
    return Response.json(status);
  } catch (error) {
    console.error("[GET /api/timesheets/status]:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
