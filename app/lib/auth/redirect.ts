const FALLBACK_PATH = "/account";

export function sanitizeNextPath(
  rawNext: string | null | undefined,
  fallback: string = FALLBACK_PATH
): string {
  const value = (rawNext || "").trim();

  if (!value) {
    return fallback;
  }

  // Must be an app-internal absolute path.
  if (!value.startsWith("/")) {
    return fallback;
  }

  // Reject protocol-relative and backslash paths.
  if (value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  // Basic control-char hardening.
  if (/[\u0000-\u001F]/.test(value)) {
    return fallback;
  }

  return value;
}
