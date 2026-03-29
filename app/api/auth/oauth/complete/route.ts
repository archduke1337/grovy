import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import {
  attachSessionCookie,
  clearOAuthStateCookie,
  readOAuthStateFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const oauthCompleteSchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
  state: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const expectedState = readOAuthStateFromRequest(req);

  try {
    const payload = oauthCompleteSchema.parse(await req.json());

    if (!expectedState || payload.state !== expectedState) {
      const response = NextResponse.json(
        { error: "Invalid OAuth state" },
        { status: 400 }
      );
      clearOAuthStateCookie(response);
      return response;
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);

    const session = await account.createSession({
      userId: payload.userId,
      secret: payload.secret,
    });

    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, session.secret, session.expire);
    clearOAuthStateCookie(response);
    return response;
  } catch (error) {
    const response =
      error instanceof z.ZodError
        ? NextResponse.json(
            { error: "Invalid OAuth completion payload", issues: error.flatten() },
            { status: 422 }
          )
        : appwriteErrorResponse(error, "OAuth completion failed", 400);

    clearOAuthStateCookie(response);
    return response;
  }
}
