import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 100 * 1024 * 1024;

function parseBytes(searchParams: URLSearchParams): number {
  const raw = searchParams.get("bytes");
  const n = raw ? Number.parseInt(raw, 10) : 0;
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.min(n, MAX_BYTES);
}

export async function GET(request: NextRequest) {
  const bytes = parseBytes(request.nextUrl.searchParams);
  if (bytes <= 0) {
    return NextResponse.json({ error: "Invalid or missing bytes" }, { status: 400 });
  }

  const t0 = performance.now();
  const body = randomBytes(bytes);
  const serverMs = performance.now() - t0;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Server-Timing": `server;dur=${serverMs.toFixed(3)}`,
    },
  });
}
