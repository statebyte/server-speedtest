import { NextResponse } from "next/server";
import { closeWebRtcPeer } from "@/lib/webrtc-peer-registry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let sessionId: string;
  try {
    const body = (await request.json()) as { sessionId?: string };
    sessionId = body.sessionId ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  closeWebRtcPeer(sessionId);
  return NextResponse.json({ ok: true });
}
