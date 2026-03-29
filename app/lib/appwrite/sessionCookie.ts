import type { NextRequest, NextResponse } from "next/server";

import { getAppwriteSessionCookieName } from "@/app/lib/appwrite/config";

const SESSION_COOKIE_SECURE = process.env.NODE_ENV === "production";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

function getOAuthStateCookieName(): string {
  return `${getAppwriteSessionCookieName()}_oauth_state`;
}

export function readSessionSecretFromRequest(req: NextRequest): string | null {
  const cookieName = getAppwriteSessionCookieName();
  return req.cookies.get(cookieName)?.value || null;
}

export function attachSessionCookie(
  res: NextResponse,
  sessionSecret: string,
  expiresAt: string
) {
  const cookieName = getAppwriteSessionCookieName();
  const expires = new Date(expiresAt);

  res.cookies.set(cookieName, sessionSecret, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
}

export function clearSessionCookie(res: NextResponse) {
  const cookieName = getAppwriteSessionCookieName();

  res.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function readOAuthStateFromRequest(req: NextRequest): string | null {
  return req.cookies.get(getOAuthStateCookieName())?.value || null;
}

export function attachOAuthStateCookie(res: NextResponse, state: string) {
  res.cookies.set(getOAuthStateCookieName(), state, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
}

export function clearOAuthStateCookie(res: NextResponse) {
  res.cookies.set(getOAuthStateCookieName(), "", {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
