import { describe, expect, it } from "vitest";

import { sanitizeNextPath } from "../app/lib/auth/redirect";

describe("sanitizeNextPath", () => {
  it("keeps valid internal paths", () => {
    expect(sanitizeNextPath("/account")).toBe("/account");
    expect(sanitizeNextPath("/playlists/123?view=grid")).toBe(
      "/playlists/123?view=grid"
    );
  });

  it("falls back for external or malformed values", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/account");
    expect(sanitizeNextPath("//evil.com")).toBe("/account");
    expect(sanitizeNextPath("\\\\evil")).toBe("/account");
    expect(sanitizeNextPath(null)).toBe("/account");
    expect(sanitizeNextPath("", "/")).toBe("/");
  });
});
