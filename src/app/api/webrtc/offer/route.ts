import { NextResponse } from "next/server";
import { registerWebRtcPeer } from "@/lib/webrtc-peer-registry";

export const runtime = "nodejs";

function waitIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", done);
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", done);
      resolve();
    }, 12_000);
  });
}

export async function POST(request: Request) {
  let sessionId: string;
  let offer: RTCSessionDescriptionInit;
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      offer?: RTCSessionDescriptionInit;
    };
    sessionId = body.sessionId ?? "";
    offer = body.offer ?? { type: "offer", sdp: "" };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sessionId || typeof offer.sdp !== "string" || !offer.sdp) {
    return NextResponse.json({ error: "sessionId and offer.sdp required" }, { status: 400 });
  }

  let pc: InstanceType<Awaited<typeof import("@roamhq/wrtc")>["RTCPeerConnection"]> | null =
    null;

  try {
    const wrtc = await import("@roamhq/wrtc");
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    pc = new wrtc.RTCPeerConnection({ iceServers });

    pc.ondatachannel = (event: { channel: RTCDataChannel }) => {
      const dc = event.channel;
      dc.binaryType = "arraybuffer";
      dc.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        try {
          dc.send(ev.data);
        } catch {
          /* ignore */
        }
      };
    };

    await pc.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitIceGatheringComplete(pc as unknown as RTCPeerConnection);

    const local = pc.localDescription;
    if (!local?.sdp) {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: "No local SDP" }, { status: 500 });
    }

    registerWebRtcPeer(sessionId, pc);

    return NextResponse.json({
      answer: { type: local.type, sdp: local.sdp },
    });
  } catch (e) {
    try {
      pc?.close();
    } catch {
      /* ignore */
    }
    const message = e instanceof Error ? e.message : "WebRTC setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
