const LOCAL_APP_URL = "http://localhost:3000";

function normalizeAppUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

export function getServerAppUrl(): string {
  return (
    normalizeAppUrl(process.env.BETTER_AUTH_URL) ??
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    LOCAL_APP_URL
  );
}

export function getClientAppUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeAppUrl(window.location.origin) ?? LOCAL_APP_URL;
  }

  return getServerAppUrl();
}

export function normalizeExternalUrl(value: string | undefined): string {
  return normalizeAppUrl(value) ?? LOCAL_APP_URL;
}
