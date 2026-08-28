const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_REDIRECT_PATH = "/dashboard";

export function parseResetEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function getSafeRedirectPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT_PATH;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT_PATH;
  }

  const path = value.split(/[?#]/)[0];
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return value;
}

export function buildPasswordResetRedirect(origin: string): string {
  const callbackOrigin = new URL("/", origin).origin;
  const callbackUrl = new URL("/auth/callback", callbackOrigin);
  callbackUrl.searchParams.set("next", "/reset-password");
  return callbackUrl.toString();
}
