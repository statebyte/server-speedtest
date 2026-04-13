import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const buf = await request.arrayBuffer();
  const t0 = performance.now();
  const bytes = buf.byteLength;
  const serverMs = performance.now() - t0;

  return NextResponse.json(
    { bytes, serverTimeMs: serverMs },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Server-Timing": `server;dur=${serverMs.toFixed(3)}`,
      },
    },
  );
}
