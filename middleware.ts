import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for auth route protection and session-aware redirects.
 *
 * Protected routes:
 *   /account — requires a session cookie; redirects to sign-in if missing.
 *
 * Auth pages when already signed in:
 *   /auth/sign-in, /auth/sign-up — redirect to /account if session exists.
 *
 * The middleware only checks for the *existence* of the session cookie, not
 * its validity. The API routes validate the session server-side.
 */

const PROTECTED_PATHS = ["/account"];
const AUTH_PAGES = ["/auth/sign-in", "/auth/sign-up"];

function getSessionCookieName(): string {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
  if (!projectId) return "a_session_unknown";
  return `a_session_${projectId}`;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieName = getSessionCookieName();
  const hasSession = Boolean(req.cookies.get(cookieName)?.value);

  // Protected pages: redirect unauthenticated users to sign-in.
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !hasSession) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Auth pages: redirect already-authenticated users to account.
  if (AUTH_PAGES.some((p) => pathname === p) && hasSession) {
    const accountUrl = req.nextUrl.clone();
    accountUrl.pathname = "/account";
    accountUrl.search = "";
    return NextResponse.redirect(accountUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/auth/sign-in", "/auth/sign-up"],
};
