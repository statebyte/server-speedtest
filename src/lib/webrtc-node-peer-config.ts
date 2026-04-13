/**
 * RTCConfiguration for @roamhq/wrtc. The native stack accepts a non-standard
 * `portRange` so deployments can publish a matching UDP range (e.g. Docker).
 * @see https://github.com/node-webrtc/node-webrtc/blob/master/docs/nonstandard-apis.md
 */
export type NodeWebRtcPeerConnectionConfig = RTCConfiguration & {
  readonly portRange?: { readonly min: number; readonly max: number };
};

function parsePortEnv(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 && n <= 65535 ? n : null;
}

export function createNodeWebRtcPeerConnectionConfig(): NodeWebRtcPeerConnectionConfig {
  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const minPort = parsePortEnv(process.env.WRTC_ICE_UDP_PORT_MIN);
  const maxPort = parsePortEnv(process.env.WRTC_ICE_UDP_PORT_MAX);
  if (
    minPort !== null &&
    maxPort !== null &&
    minPort <= maxPort &&
    maxPort - minPort <= 50_000
  ) {
    return { iceServers, portRange: { min: minPort, max: maxPort } };
  }

  return { iceServers };
}
