import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { attachSessionCookie } from "@/app/lib/appwrite/sessionCookie";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  try {
    const payload = signInSchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);

    const session = await account.createEmailPasswordSession({
      email: payload.email,
      password: payload.password,
    });

    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, session.secret, session.expire);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sign in payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Sign in failed", 401);
  }
}
