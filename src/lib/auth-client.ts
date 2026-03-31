import { createAuthClient } from "better-auth/react";
import { getClientAppUrl } from "./app-url";

export const authClient = createAuthClient({
  baseURL: getClientAppUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
