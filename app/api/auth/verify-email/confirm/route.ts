import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const verifySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const payload = verifySchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;

    // Use admin client — the verification token (userId + secret) is the
    // proof of ownership. Admin client also bypasses server-IP rate limits.
    const { account } = createAdminAppwriteClients(userAgent);

    await account.updateEmailVerification({
      userId: payload.userId,
      secret: payload.secret,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verification payload" },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Email verification failed", 400);
  }
}
