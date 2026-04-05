import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { updateProfileSchema } from "@/lib/validations/profile.schema";

const userProfileSelect = {
  createdAt: user.createdAt,
  department: user.department,
  email: user.email,
  id: user.id,
  image: user.image,
  isActive: user.isActive,
  name: user.name,
  role: user.role,
  timeAssistantEnabled: user.timeAssistantEnabled,
  timeDefaultBillable: user.timeDefaultBillable,
  timeDefaultDuration: user.timeDefaultDuration,
  timeDefaultView: user.timeDefaultView,
  timeOutlookDefaultOpen: user.timeOutlookDefaultOpen,
  timeShowWeekends: user.timeShowWeekends,
  timeSubmitMode: user.timeSubmitMode,
  updatedAt: user.updatedAt,
  weeklyCapacity: user.weeklyCapacity,
} as const;

export async function GET(req: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const found = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: {
        createdAt: true,
        department: true,
        email: true,
        id: true,
        image: true,
        isActive: true,
        name: true,
        role: true,
        timeAssistantEnabled: true,
        timeDefaultBillable: true,
        timeDefaultDuration: true,
        timeDefaultView: true,
        timeOutlookDefaultOpen: true,
        timeShowWeekends: true,
        timeSubmitMode: true,
        updatedAt: true,
        weeklyCapacity: true,
      },
    });

    if (!found) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(found);
  } catch (err) {
    console.error("[GET /api/user/profile]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const updates: Partial<typeof user.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (typeof data.name !== "undefined") {
    updates.name = data.name;
  }
  if (typeof data.department !== "undefined") {
    updates.department = data.department ?? null;
  }
  if (typeof data.weeklyCapacity !== "undefined") {
    updates.weeklyCapacity = data.weeklyCapacity;
  }
  if (typeof data.timeDefaultView !== "undefined") {
    updates.timeDefaultView = data.timeDefaultView;
  }
  if (typeof data.timeDefaultDuration !== "undefined") {
    updates.timeDefaultDuration = data.timeDefaultDuration;
  }
  if (typeof data.timeSubmitMode !== "undefined") {
    updates.timeSubmitMode = data.timeSubmitMode;
  }
  if (typeof data.timeDefaultBillable !== "undefined") {
    updates.timeDefaultBillable = data.timeDefaultBillable;
  }
  if (typeof data.timeAssistantEnabled !== "undefined") {
    updates.timeAssistantEnabled = data.timeAssistantEnabled;
  }
  if (typeof data.timeOutlookDefaultOpen !== "undefined") {
    updates.timeOutlookDefaultOpen = data.timeOutlookDefaultOpen;
  }
  if (typeof data.timeShowWeekends !== "undefined") {
    updates.timeShowWeekends = data.timeShowWeekends;
  }

  try {
    const [updated] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, session.user.id))
      .returning(userProfileSelect);

    if (!updated) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("[PATCH /api/user/profile]", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
