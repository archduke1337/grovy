import { NextRequest, NextResponse } from "next/server";

import {
  attachSessionCookie,
  readSessionSecretFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const existingSession = readSessionSecretFromRequest(req);

  if (existingSession) {
    return NextResponse.json({ ok: true, reused: true });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);
    const session = await account.createAnonymousSession();

    const response = NextResponse.json({ ok: true, reused: false });
    attachSessionCookie(response, session.secret, session.expire);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not create anonymous session" },
      { status: 500 }
    );
  }
}
