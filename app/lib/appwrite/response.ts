import { AppwriteException, type Models } from "node-appwrite";
import { NextResponse } from "next/server";

import type { AuthUser } from "@/app/types/auth";

export function toAuthUser(
  user: Models.User<Models.Preferences>
): AuthUser {
  return {
    id: user.$id,
    name: user.name || "",
    email: user.email,
    emailVerification: Boolean(user.emailVerification),
    labels: Array.isArray(user.labels) ? user.labels : [],
  };
}

export function appwriteErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400
) {
  if (error instanceof AppwriteException) {
    const status = error.code && error.code > 0 ? error.code : fallbackStatus;
    return NextResponse.json(
      { error: error.message || fallbackMessage },
      { status }
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: fallbackStatus });
}
