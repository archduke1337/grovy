import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const verifySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const payload = verifySchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);

    await account.updateEmailVerification({
      userId: payload.userId,
      secret: payload.secret,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verification payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Email verification failed", 400);
  }
}
