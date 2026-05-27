import { NextRequest, NextResponse } from "next/server";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import {
  clearSessionCookie,
  readSessionSecretFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (!sessionSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createSessionAppwriteClients(sessionSecret, userAgent);
    const session = await account.getSession({ sessionId: "current" });

    if (session.provider === "anonymous") {
      const response = NextResponse.json(
        { error: "Sign in to verify email" },
        { status: 401 }
      );
      clearSessionCookie(response);
      return response;
    }

    const verificationUrl = `${new URL(req.url).origin}/auth/verify-email`;

    await account.createEmailVerification({ url: verificationUrl });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return appwriteErrorResponse(error, "Could not send verification email", 400);
  }
}
