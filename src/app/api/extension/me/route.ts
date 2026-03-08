import {
  extensionJson,
  extensionOptions,
  resolveExtensionUser,
} from "@/lib/extension-auth";

export function OPTIONS() {
  return extensionOptions();
}

/**
 * GET /api/extension/me
 * Validates the extension token and returns the authenticated user's info.
 */
export async function GET(req: Request): Promise<Response> {
  const extUser = await resolveExtensionUser(req);
  if (!extUser) {
    return extensionJson({ error: "Unauthorized" }, { status: 401 });
  }

  return extensionJson({
    id: extUser.id,
    name: extUser.name,
    email: extUser.email,
    role: extUser.role,
  });
}
