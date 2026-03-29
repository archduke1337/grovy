import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse, toAuthUser } from "@/app/lib/appwrite/response";
import { attachSessionCookie } from "@/app/lib/appwrite/sessionCookie";
import { createPublicAppwriteClients } from "@/app/lib/appwrite/server";

export const runtime = "nodejs";

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  try {
    const payload = signUpSchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account } = createPublicAppwriteClients(userAgent);

    const user = await account.create({
      userId: ID.unique(),
      email: payload.email,
      password: payload.password,
      name: payload.name,
    });

    const session = await account.createEmailPasswordSession({
      email: payload.email,
      password: payload.password,
    });

    const response = NextResponse.json(
      {
        ok: true,
        user: toAuthUser(user),
      },
      { status: 201 }
    );

    attachSessionCookie(response, session.secret, session.expire);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sign up payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Sign up failed", 400);
  }
}
