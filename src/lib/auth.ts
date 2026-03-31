import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getServerAppUrl } from "./app-url";
import { db } from "./db";
import { refreshMicrosoftAccessToken } from "./microsoft-oauth";

const microsoftTenantId = process.env.MICROSOFT_TENANT_ID ?? "common";
const allowedEmailDomain = "@optsolv.com.br";

export const auth = betterAuth({
  baseURL: getServerAppUrl(),
  trustedOrigins: [getServerAppUrl(), "http://localhost:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-client-ip"],
    },
    useSecureCookies: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "member",
      },
      department: {
        type: "string",
        required: false,
      },
      managerId: {
        type: "string",
        required: false,
      },
      hourlyRate: {
        type: "number",
        required: false,
      },
      azureId: {
        type: "string",
        required: false,
      },
      weeklyCapacity: {
        type: "number",
        required: true,
        defaultValue: 40,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: microsoftTenantId,
      scope: [
        "openid",
        "profile",
        "email",
        "User.Read",
        "Calendars.Read",
        "offline_access",
      ],
      refreshAccessToken: refreshMicrosoftAccessToken,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const normalizedEmail = user.email.trim().toLowerCase();

          if (!normalizedEmail.endsWith(allowedEmailDomain)) {
            console.warn(
              "[auth] Rejected user creation for non-OptSolv email",
              {
                email: user.email,
              },
            );
            throw new Error(
              "Apenas e-mails do dominio @optsolv.com.br sao permitidos.",
            );
          }

          return {
            data: {
              ...user,
              email: normalizedEmail,
            },
          };
        },
      },
    },
  },
  onAPIError: {
    onError: (error, ctx) => {
      console.error("[auth] Better Auth API error", {
        message: error.message,
        name: error.name,
        path: ctx.path,
      });
    },
    errorURL: "/login",
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["microsoft"],
    },
  },
});
