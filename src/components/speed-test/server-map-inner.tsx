"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface ServerMapEndpoint {
  readonly lat: number;
  readonly lon: number;
  readonly title: string;
  readonly ip: string | null;
}

interface ServerMapInnerProps {
  readonly server: ServerMapEndpoint;
  readonly client: ServerMapEndpoint | null;
  readonly youLabel: string;
  readonly serverLabel: string;
  readonly midpointTitle: string;
}

const TILE = 256;

function project(lat: number, lon: number, z: number): { x: number; y: number } {
  const scale = TILE * 2 ** z;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function pickView(
  points: readonly { lat: number; lon: number }[],
  width: number,
  height: number,
  padding: number,
): { z: number; centerX: number; centerY: number } {
  const pad = padding;
  const innerW = Math.max(32, width - 2 * pad);
  const innerH = Math.max(32, height - 2 * pad);
  const markerSlack = 28;

  if (points.length === 0) {
    const z = 2;
    const c = project(20, 0, z);
    return { z, centerX: c.x, centerY: c.y };
  }
  if (points.length === 1) {
    const p = points[0]!;
    const z = 4;
    const c = project(p.lat, p.lon, z);
    return { z, centerX: c.x, centerY: c.y };
  }

  let chosenZ = 0;
  let centerX = 0;
  let centerY = 0;
  let found = false;

  for (let z = 18; z >= 0; z--) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of points) {
      const q = project(p.lat, p.lon, z);
      xs.push(q.x);
      ys.push(q.y);
    }
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    if (spanX <= innerW - markerSlack && spanY <= innerH - markerSlack) {
      chosenZ = z;
      centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      found = true;
      break;
    }
  }

  if (!found) {
    chosenZ = 0;
    const xs = points.map((p) => project(p.lat, p.lon, chosenZ).x);
    const ys = points.map((p) => project(p.lat, p.lon, chosenZ).y);
    centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  }

  return { z: chosenZ, centerX, centerY };
}

function tileUrl(z: number, x: number, y: number): string {
  const s = "abc"[(x + y) % 3]!;
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

type ActiveMarker = "client" | "server" | null;

export function ServerMapInner({
  server,
  client,
  youLabel,
  serverLabel,
  midpointTitle,
}: ServerMapInnerProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 220 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(1, Math.round(cr.width));
      const h = Math.max(1, Math.round(cr.height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clientOk =
    client != null &&
    Number.isFinite(client.lat) &&
    Number.isFinite(client.lon) &&
    Math.abs(client.lat) <= 90 &&
    Math.abs(client.lon) <= 180;

  const points = useMemo(() => {
    const list: { lat: number; lon: number }[] = [{ lat: server.lat, lon: server.lon }];
    if (clientOk && client) list.push({ lat: client.lat, lon: client.lon });
    return list;
  }, [client, clientOk, server.lat, server.lon]);

  const view = useMemo(
    () => pickView(points, size.w, size.h, 36),
    [points, size.w, size.h],
  );

  const { z, centerX, centerY } = view;
  const originX = centerX - size.w / 2;
  const originY = centerY - size.h / 2;

  const toScreen = (lat: number, lon: number) => {
    const p = project(lat, lon, z);
    return { x: p.x - originX, y: p.y - originY };
  };

  const serverScr = toScreen(server.lat, server.lon);
  const clientScr =
    clientOk && client ? toScreen(client.lat, client.lon) : null;

  const linePositions =
    clientScr && client && !(client.lat === server.lat && client.lon === server.lon)
      ? { x1: clientScr.x, y1: clientScr.y, x2: serverScr.x, y2: serverScr.y }
      : null;

  const midpointScr = useMemo(() => {
    if (!linePositions) return null;
    return {
      x: (linePositions.x1 + linePositions.x2) / 2,
      y: (linePositions.y1 + linePositions.y2) / 2,
    };
  }, [linePositions]);

  const tiles = useMemo(() => {
    const mod = 2 ** z;
    const x0 = Math.floor(originX / TILE);
    const x1 = Math.floor((originX + size.w) / TILE);
    const y0 = Math.floor(originY / TILE);
    const y1 = Math.floor((originY + size.h) / TILE);
    const tyMin = Math.max(0, y0);
    const tyMax = Math.min(mod - 1, y1);
    const list: { key: string; z: number; x: number; y: number; left: number; top: number }[] = [];
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = tyMin; ty <= tyMax; ty++) {
        const xm = ((tx % mod) + mod) % mod;
        list.push({
          key: `${z}/${xm}/${ty}`,
          z,
          x: xm,
          y: ty,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        });
      }
    }
    return list;
  }, [originX, originY, size.w, size.h, z]);

  const [active, setActive] = useState<ActiveMarker>(null);
  useEffect(() => {
    setActive(null);
  }, [server.lat, server.lon, client?.lat, client?.lon]);

  return (
    <div
      ref={wrapRef}
      className="server-map-zoom-in server-map-root relative z-0 h-[220px] w-full overflow-hidden rounded-lg bg-muted"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={tileUrl(t.z, t.x, t.y)}
            alt=""
            width={TILE}
            height={TILE}
            className="absolute max-w-none select-none"
            style={{ left: t.left, top: t.top }}
            draggable={false}
          />
        ))}
      </div>

      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        aria-hidden
      >
        {linePositions ? (
          <line
            x1={linePositions.x1}
            y1={linePositions.y1}
            x2={linePositions.x2}
            y2={linePositions.y2}
            stroke="var(--foreground)"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeDasharray="6 8"
          />
        ) : null}
      </svg>

      {midpointScr ? (
        <div
          className="geo-midpoint-wrap pointer-events-none absolute"
          style={{
            left: midpointScr.x,
            top: midpointScr.y,
            transform: "translate(-50%, -50%)",
          }}
          title={midpointTitle}
        >
          <div className="geo-midpoint-dot" />
        </div>
      ) : null}

      {clientScr && clientOk && client ? (
        <button
          type="button"
          className="geo-marker-wrap absolute cursor-pointer border-0 bg-transparent p-0"
          style={{
            left: clientScr.x,
            top: clientScr.y,
            transform: "translate(-50%, -50%)",
          }}
          title={youLabel}
          aria-label={youLabel}
          aria-pressed={active === "client"}
          onClick={() => setActive((a) => (a === "client" ? null : "client"))}
        >
          <div
            className="geo-marker-dot"
            style={{ background: "var(--speed-download)" }}
          />
        </button>
      ) : null}

      <button
        type="button"
        className="geo-marker-wrap absolute cursor-pointer border-0 bg-transparent p-0"
        style={{
          left: serverScr.x,
          top: serverScr.y,
          transform: "translate(-50%, -50%)",
        }}
        title={serverLabel}
        aria-label={serverLabel}
        aria-pressed={active === "server"}
        onClick={() => setActive((a) => (a === "server" ? null : "server"))}
      >
        <div
          className="geo-marker-dot"
          style={{ background: "var(--speed-upload)" }}
        />
      </button>

      {active ? (
        <div className="absolute bottom-1 left-1 right-1 rounded-md border border-border bg-card/95 px-2 py-1.5 text-left text-card-foreground shadow-sm backdrop-blur-sm">
          <div className="text-sm font-medium">
            {active === "client" ? youLabel : serverLabel}
          </div>
          {active === "client" && client ? (
            <>
              {client.title ? (
                <div className="text-xs opacity-90">{client.title}</div>
              ) : null}
              {client.ip ? <div className="font-mono text-xs">{client.ip}</div> : null}
            </>
          ) : (
            <>
              {server.title ? (
                <div className="text-xs opacity-90">{server.title}</div>
              ) : null}
              {server.ip ? <div className="font-mono text-xs">{server.ip}</div> : null}
            </>
          )}
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-1 right-1 max-w-[min(100%,220px)] rounded bg-background/80 px-1 py-0.5 text-[10px] leading-tight text-muted-foreground backdrop-blur-sm">
        ©{" "}
        <a
          className="pointer-events-auto underline"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}
