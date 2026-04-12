export function formatMbps(bps: number | null | undefined): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) {
    return "—";
  }
  const mbps = bps / 1e6;
  const digits = mbps >= 100 ? 0 : mbps >= 10 ? 1 : 2;
  return `${mbps.toFixed(digits)} Mbps`;
}

export function formatMbpsNumber(bps: number | null | undefined): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) {
    return "—";
  }
  const mbps = bps / 1e6;
  const digits = mbps >= 100 ? 0 : mbps >= 10 ? 1 : 2;
  return mbps.toFixed(digits);
}

export function formatMs(ms: number | null | undefined, digits = 1): string {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  return `${ms.toFixed(digits)} ms`;
}

export function formatPercent(ratio: number | null | undefined, digits = 2): string {
  if (ratio == null || !Number.isFinite(ratio)) {
    return "—";
  }
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatBytesLabel(bytes: number): string {
  if (bytes >= 1e6) {
    return `${bytes / 1e6}MB`;
  }
  if (bytes >= 1e3) {
    return `${bytes / 1e3}kB`;
  }
  return `${bytes}B`;
}
