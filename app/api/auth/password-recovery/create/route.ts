import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const recoverySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  try {
    const payload = recoverySchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);
    const recoveryUrl = `${new URL(req.url).origin}/auth/reset-password`;

    await account.createRecovery({
      email: payload.email,
      url: recoveryUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid recovery payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Password recovery request failed", 400);
  }
}
