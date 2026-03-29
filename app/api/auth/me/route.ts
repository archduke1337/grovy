import { NextRequest, NextResponse } from "next/server";

import { toAuthUser } from "@/app/lib/appwrite/response";
import {
  clearSessionCookie,
  readSessionSecretFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (!sessionSecret) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createSessionAppwriteClients(sessionSecret, userAgent);
    const user = await account.get();

    return NextResponse.json({
      authenticated: true,
      user: toAuthUser(user),
    });
  } catch {
    const response = NextResponse.json({ authenticated: false, user: null });
    clearSessionCookie(response);
    return response;
  }
}
