/** Base URL of the OptSolv Time Tracker API. Configured during extension setup. */
const STORAGE_KEY_TOKEN = "optsolv_extension_token";
const STORAGE_KEY_API_URL = "optsolv_api_url";

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function getStoredApiUrl(): string | null {
  return localStorage.getItem(STORAGE_KEY_API_URL);
}

export function saveCredentials(apiUrl: string, token: string): void {
  localStorage.setItem(STORAGE_KEY_API_URL, apiUrl.replace(/\/$/, ""));
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_API_URL);
}

export function isConfigured(): boolean {
  return !!(getStoredToken() && getStoredApiUrl());
}
