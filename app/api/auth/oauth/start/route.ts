import { OAuthProvider } from "node-appwrite";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { sanitizeNextPath } from "@/app/lib/auth/redirect";
import { attachOAuthStateCookie } from "@/app/lib/appwrite/sessionCookie";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const PROVIDER_MAP = {
  google: OAuthProvider.Google,
  github: OAuthProvider.Github,
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const providerParam = (url.searchParams.get("provider") || "").toLowerCase();
  const nextPath = sanitizeNextPath(url.searchParams.get("next"));
  const provider = PROVIDER_MAP[providerParam as keyof typeof PROVIDER_MAP];

  if (!provider) {
    return NextResponse.json({ error: "Unsupported OAuth provider" }, { status: 400 });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createAdminAppwriteClients(userAgent);
    const state = randomUUID();
    const successUrl = `${url.origin}/auth/oauth/callback?next=${encodeURIComponent(nextPath)}&state=${encodeURIComponent(state)}`;
    const failureUrl = `${url.origin}/auth/sign-in?oauth=failed&next=${encodeURIComponent(nextPath)}`;

    const redirectUrl = await account.createOAuth2Token({
      provider,
      success: successUrl,
      failure: failureUrl,
    });

    const response = NextResponse.redirect(redirectUrl);
    attachOAuthStateCookie(response, state);
    return response;
  } catch (error) {
    return appwriteErrorResponse(error, "Could not start OAuth flow", 400);
  }
}
