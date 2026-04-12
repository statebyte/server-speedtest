import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const t0 = performance.now();
  const buf = await request.arrayBuffer();
  const serverMs = performance.now() - t0;

  return NextResponse.json(
    { bytes: buf.byteLength, serverTimeMs: serverMs },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Server-Timing": `server;dur=${serverMs.toFixed(3)}`,
      },
    },
  );
}
