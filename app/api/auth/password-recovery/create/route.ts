import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const recoverySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  try {
    const payload = recoverySchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;

    // Use admin client to bypass server-IP rate limits for password recovery.
    const { account } = createAdminAppwriteClients(userAgent);
    const recoveryUrl = `${new URL(req.url).origin}/auth/reset-password`;

    await account.createRecovery({
      email: payload.email,
      url: recoveryUrl,
    });

    // Always return success to prevent email enumeration attacks.
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid recovery payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    // Still return success for non-validation errors to prevent
    // email enumeration. Log server-side for debugging.
    console.error("[password-recovery/create]", error);
    return NextResponse.json({ ok: true });
  }
}
