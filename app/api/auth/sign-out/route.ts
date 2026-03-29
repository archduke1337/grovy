import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, readSessionSecretFromRequest } from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (sessionSecret) {
    try {
      const userAgent = req.headers.get("user-agent") || undefined;
      const { account } = createSessionAppwriteClients(sessionSecret, userAgent);
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Ignore Appwrite errors on sign out to make endpoint idempotent.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
