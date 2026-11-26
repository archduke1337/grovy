import { NextRequest } from "next/server";

type LocationPayload = {
  city: string | null;
  region: string | null;
  country: string | null;
  label: string | null;
  source: "headers" | "ip-lookup" | "fallback";
};

function pickFirstHeader(headers: Headers, names: string[]): string {
  for (const name of names) {
    const value = headers.get(name);
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toCountryName(countryCode: string): string {
  if (!countryCode) return "";

  try {
    if (typeof Intl.DisplayNames !== "undefined") {
      const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
      return displayNames.of(countryCode.toUpperCase()) || countryCode.toUpperCase();
    }
  } catch {
    // Ignore conversion failure and fallback to code.
  }

  return countryCode.toUpperCase();
}

function formatLabel(city: string, country: string): string {
  const safeCity = normalizeName(city);
  const safeCountry = normalizeName(country);

  if (safeCity && safeCountry) return `${safeCity}, ${safeCountry}`;
  if (safeCity) return safeCity;
  if (safeCountry) return safeCountry;
  return "";
}

// Platform-set headers (cf-connecting-ip, x-vercel-*) are trusted because they
// are set by Cloudflare/Vercel at the edge. `x-forwarded-for` is never read
// here: on a deployment without those platforms a client controls it, and the
// caller of this function is a third-party lookup, not a rate limiter.
function getClientIp(request: NextRequest): string {
  return pickFirstHeader(request.headers, ["cf-connecting-ip", "x-real-ip"]);
}

/**
 * Only trust an IP-derived location when the request actually came through an
 * edge that sets reliable client-IP headers. Self-hosted deployments and plain
 * `next start` have neither, and there the header is client-controlled, so an
 * anonymous caller could make us issue one third-party lookup per request with
 * an IP of their choosing (burning the deployment's shared ipapi.co quota).
 */
function canTrustClientIp(request: NextRequest): boolean {
  if (process.env.ALLOW_IP_LOOKUP === "1") return true;
  if (process.env.VERCEL === "1" || process.env.CF_PAGES === "1") return true;
  return Boolean(request.headers.get("cf-connecting-ip"));
}

function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (!normalized) return true;

  if (normalized === "::1" || normalized === "localhost") return true;
  if (normalized.startsWith("127.")) return true;
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) {
    return true;
  }

  return false;
}

async function lookupByIp(ip: string): Promise<LocationPayload | null> {
  if (!ip || isPrivateOrLocalIp(ip)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) return null;

    const data = await response.json();
    const city = normalizeName(String(data?.city || ""));
    const region = normalizeName(String(data?.region || ""));
    const country = normalizeName(String(data?.country_name || data?.country || ""));
    const label = formatLabel(city, country);

    if (!label) return null;

    return {
      city: city || null,
      region: region || null,
      country: country || null,
      label,
      source: "ip-lookup",
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const city = normalizeName(
    pickFirstHeader(request.headers, ["x-vercel-ip-city", "cf-ipcity", "x-geo-city"])
  );
  const region = normalizeName(
    pickFirstHeader(request.headers, [
      "x-vercel-ip-country-region",
      "x-vercel-ip-region",
      "cf-region",
      "x-geo-region",
    ])
  );
  const countryCode = normalizeName(
    pickFirstHeader(request.headers, ["x-vercel-ip-country", "cf-ipcountry", "x-geo-country"])
  );
  const countryName = toCountryName(countryCode);
  const label = formatLabel(city, countryName);

  if (label) {
    const payload: LocationPayload = {
      city: city || null,
      region: region || null,
      country: countryName || null,
      label,
      source: "headers",
    };

    return Response.json(payload, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  }

  const ipLookup = canTrustClientIp(request) ? await lookupByIp(getClientIp(request)) : null;
  if (ipLookup) {
    return Response.json(ipLookup, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  }

  return Response.json(
    {
      city: null,
      region: null,
      country: null,
      label: null,
      source: "fallback",
    } satisfies LocationPayload,
    {
      headers: { "Cache-Control": "private, max-age=120" },
    }
  );
}
