import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const confirmRecoverySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(1),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  try {
    const payload = confirmRecoverySchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);

    await account.updateRecovery({
      userId: payload.userId,
      secret: payload.secret,
      password: payload.password,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid password reset payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Password reset failed", 400);
  }
}
