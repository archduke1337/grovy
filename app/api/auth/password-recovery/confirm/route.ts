import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";

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

    // Use admin client to bypass server-IP rate limits.
    const { account } = createAdminAppwriteClients(userAgent);

    await account.updateRecovery({
      userId: payload.userId,
      secret: payload.secret,
      password: payload.password,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid password reset payload" },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Password reset failed", 400);
  }
}
