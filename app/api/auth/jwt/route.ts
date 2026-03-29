import { NextRequest, NextResponse } from "next/server";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import {
  clearSessionCookie,
  readSessionSecretFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const REALTIME_JWT_DURATION_SECONDS = 15 * 60;

export async function GET(req: NextRequest) {
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
        { error: "Sign in to enable realtime sync" },
        { status: 401 }
      );
      clearSessionCookie(response);
      return response;
    }

    const jwt = await account.createJWT({
      duration: REALTIME_JWT_DURATION_SECONDS,
    });

    return NextResponse.json({
      jwt: jwt.jwt,
    });
  } catch (error) {
    const response = appwriteErrorResponse(
      error,
      "Could not create realtime token",
      401
    );
    clearSessionCookie(response);
    return response;
  }
}
