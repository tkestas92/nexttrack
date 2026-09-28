import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const allow = createRateLimiter(30, 60_000);
const TRACK_ID = /^\d{1,15}$/;
const TEN_MINUTES = 600_000;

type PreviewBody = { preview: string; link: string };

const memoryCache = new Map<string, { expires: number; body: PreviewBody }>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!TRACK_ID.test(id)) {
    return NextResponse.json(
      { error: "Track id must be digits." },
      { status: 400 },
    );
  }

  if (!allow(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  const cached = memoryCache.get(id);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  }
  if (cached) memoryCache.delete(id);

  try {
    const response = await fetch(`https://api.deezer.com/track/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      return NextResponse.json(
        { error: status === 404 ? "Track not found." : "Deezer is unavailable." },
        { status },
      );
    }

    const payload: unknown = await response.json();
    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    if (record.error) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    const preview = httpsUrl(record.preview);
    if (!preview) {
      return NextResponse.json(
        { error: "No preview for this track." },
        {
          status: 404,
          headers: { "Cache-Control": "public, max-age=600" },
        },
      );
    }

    const result: PreviewBody = {
      preview,
      link: httpsUrl(record.link) ?? `https://www.deezer.com/track/${id}`,
    };
    memoryCache.set(id, { expires: Date.now() + TEN_MINUTES, body: result });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Deezer is unavailable." },
      { status: 502 },
    );
  }
}
