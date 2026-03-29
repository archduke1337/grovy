import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import { readSessionSecretFromRequest } from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  patch: z.record(z.string(), z.unknown()),
});

export async function GET(req: NextRequest) {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (!sessionSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createSessionAppwriteClients(sessionSecret, userAgent);
    const prefs = await account.getPrefs();

    return NextResponse.json({ prefs: prefs || {} });
  } catch (error) {
    return appwriteErrorResponse(error, "Failed to load user preferences", 400);
  }
}

export async function PATCH(req: NextRequest) {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (!sessionSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = patchSchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createSessionAppwriteClients(sessionSecret, userAgent);
    const currentPrefs = await account.getPrefs();

    const nextPrefs = {
      ...(currentPrefs || {}),
      ...payload.patch,
    };

    await account.updatePrefs(nextPrefs);

    return NextResponse.json({ prefs: nextPrefs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid preferences payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Failed to update preferences", 400);
  }
}
