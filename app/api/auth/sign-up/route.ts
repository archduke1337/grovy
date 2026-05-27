import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { z } from "zod";

import { appwriteErrorResponse, toAuthUser } from "@/app/lib/appwrite/response";
import { attachSessionCookie } from "@/app/lib/appwrite/sessionCookie";
import { createAdminAppwriteClients } from "@/app/lib/appwrite/server";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimitResult = checkRateLimit(`signup:${ip}`, 3, 300000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many sign up attempts. Please try again later." },
        { status: 429 }
      );
    }
    const payload = signUpSchema.parse(await req.json());
    const userAgent = req.headers.get("user-agent") || undefined;

    // Use admin client for account creation to bypass server-IP rate limits.
    // Per Appwrite SSR docs, unauthenticated server requests should use an
    // API key so they are not rate-limited as a single IP.
    const { account } = createAdminAppwriteClients(userAgent);

    const user = await account.create({
      userId: ID.unique(),
      email: payload.email,
      password: payload.password,
      name: payload.name,
    });

    // Create a session for the newly registered user.
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
        { error: "Invalid sign up payload" },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Sign up failed", 400);
  }
}
