import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 1024 * 1024 * 1024;
const STREAM_CHUNK = 64 * 1024;

function parseBytes(searchParams: URLSearchParams): number {
  const raw = searchParams.get("bytes");
  const n = raw ? Number.parseInt(raw, 10) : 0;
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }
  return Math.min(n, MAX_BYTES);
}

function createRandomByteStream(totalBytes: number): ReadableStream<Uint8Array> {
  let sent = 0;
  return new ReadableStream({
    pull(controller) {
      if (sent >= totalBytes) {
        controller.close();
        return;
      }
      const remaining = totalBytes - sent;
      const size = Math.min(STREAM_CHUNK, remaining);
      controller.enqueue(randomBytes(size));
      sent += size;
      if (sent >= totalBytes) {
        controller.close();
      }
    },
  });
}

export async function GET(request: NextRequest) {
  const bytes = parseBytes(request.nextUrl.searchParams);
  if (bytes <= 0) {
    return NextResponse.json({ error: "Invalid or missing bytes" }, { status: 400 });
  }

  const body = createRandomByteStream(bytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
