import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { attachSessionCookie } from "@/app/lib/appwrite/sessionCookie";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const oauthCompleteSchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const payload = oauthCompleteSchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createAdminAppwriteClients(userAgent);

    const session = await account.createSession({
      userId: payload.userId,
      secret: payload.secret,
    });

    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, session.secret, session.expire);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid OAuth completion payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "OAuth completion failed", 400);
  }
}
