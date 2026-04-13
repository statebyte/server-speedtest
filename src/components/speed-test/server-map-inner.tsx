"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

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
const Z_MIN = 1;
const Z_MAX = 18;

function project(lat: number, lon: number, z: number): { x: number; y: number } {
  const scale = TILE * 2 ** z;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/** Inverse of `project` at integer zoom level `z` (Web Mercator world pixels). */
function unproject(worldX: number, worldY: number, z: number): { lat: number; lon: number } {
  const scale = TILE * 2 ** z;
  const lon = (worldX / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * worldY) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lon };
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

  for (let z = Z_MAX; z >= 0; z--) {
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

function clampZ(z: number): number {
  return Math.min(Z_MAX, Math.max(Z_MIN, Math.round(z)));
}

/** Keep the geographic point under screen (sx, sy) fixed after changing zoom from z to z2. */
function zoomAtScreenPoint(
  centerX: number,
  centerY: number,
  z: number,
  z2: number,
  sx: number,
  sy: number,
  w: number,
  h: number,
): { centerX: number; centerY: number } {
  const originX = centerX - w / 2;
  const originY = centerY - h / 2;
  const { lat, lon } = unproject(originX + sx, originY + sy, z);
  const p2 = project(lat, lon, z2);
  const newOriginX = p2.x - sx;
  const newOriginY = p2.y - sy;
  return { centerX: newOriginX + w / 2, centerY: newOriginY + h / 2 };
}

type ActiveMarker = "client" | "server" | null;

interface MapViewState {
  readonly centerX: number;
  readonly centerY: number;
  readonly z: number;
}

export function ServerMapInner({
  server,
  client,
  youLabel,
  serverLabel,
  midpointTitle,
}: ServerMapInnerProps) {
  const { t } = useTranslation();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 320, h: 220 });

  const viewRef = useRef<MapViewState>({ centerX: 0, centerY: 0, z: 0 });
  const pointersRef = useRef(
    new Map<number, { readonly clientX: number; readonly clientY: number }>(),
  );
  const dragRef = useRef<{
    readonly pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{
    readonly idA: number;
    readonly idB: number;
    readonly startDist: number;
    readonly startZ: number;
    readonly startCenterX: number;
    readonly startCenterY: number;
    readonly midX: number;
    readonly midY: number;
  } | null>(null);

  const wheelAccumRef = useRef(0);

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

  const autoView = useMemo(
    () => pickView(points, size.w, size.h, 36),
    [points, size.w, size.h],
  );

  /** When null, the map follows `autoView` (fit to markers + container size). */
  const [userOverride, setUserOverride] = useState<MapViewState | null>(null);
  const view = userOverride ?? autoView;
  const { centerX, centerY, z } = view;

  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [disableTileTransition, setDisableTileTransition] = useState(false);

  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);
  const originX = centerX - size.w / 2;
  const originY = centerY - size.h / 2;

  const toScreen = useCallback(
    (lat: number, lon: number) => {
      const p = project(lat, lon, z);
      return { x: p.x - originX, y: p.y - originY };
    },
    [originX, originY, z],
  );

  const serverScr = toScreen(server.lat, server.lon);
  const clientScr =
    clientOk && client ? toScreen(client.lat, client.lon) : null;

  const linePositions = useMemo(() => {
    if (!clientOk || !client) return null;
    if (client.lat === server.lat && client.lon === server.lon) return null;
    const s = toScreen(server.lat, server.lon);
    const c = toScreen(client.lat, client.lon);
    return { x1: c.x, y1: c.y, x2: s.x, y2: s.y };
  }, [client, clientOk, server.lat, server.lon, toScreen]);

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
          left: tx * TILE,
          top: ty * TILE,
        });
      }
    }
    return list;
  }, [originX, originY, size.w, size.h, z]);

  const applyZoom = useCallback(
    (nextZ: number, anchorSx: number, anchorSy: number) => {
      const z2 = clampZ(nextZ);
      setDisableTileTransition(true);
      setUserOverride((prev) => {
        const base = prev ?? autoView;
        if (base.z === z2) return prev;
        const next = zoomAtScreenPoint(
          base.centerX,
          base.centerY,
          base.z,
          z2,
          anchorSx,
          anchorSy,
          size.w,
          size.h,
        );
        return { centerX: next.centerX, centerY: next.centerY, z: z2 };
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDisableTileTransition(false));
      });
    },
    [autoView, size.h, size.w],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      wheelAccumRef.current += e.deltaY;
      const step = 80;
      const v = viewRef.current;
      if (wheelAccumRef.current > step) {
        wheelAccumRef.current = 0;
        applyZoom(v.z - 1, sx, sy);
      } else if (wheelAccumRef.current < -step) {
        wheelAccumRef.current = 0;
        applyZoom(v.z + 1, sx, sy);
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [applyZoom]);

  const beginPinchFromPointers = useCallback(
    (el: HTMLDivElement) => {
      const ids = [...pointersRef.current.keys()];
      if (ids.length !== 2) return;
      const idA = ids[0]!;
      const idB = ids[1]!;
      const t0 = pointersRef.current.get(idA);
      const t1 = pointersRef.current.get(idB);
      if (!t0 || !t1) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const v = viewRef.current;
      pinchRef.current = {
        idA,
        idB,
        startDist: Math.max(8, dist),
        startZ: v.z,
        startCenterX: v.centerX,
        startCenterY: v.centerY,
        midX: (t0.clientX + t1.clientX) / 2 - rect.left,
        midY: (t0.clientY + t1.clientY) / 2 - rect.top,
      };
      dragRef.current = null;
      setIsDragging(false);
      setIsPinching(true);
      setDisableTileTransition(true);
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      if (pointersRef.current.size === 2) {
        beginPinchFromPointers(el);
        return;
      }
      dragRef.current = {
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      };
      setIsDragging(true);
      setDisableTileTransition(true);
    },
    [beginPinchFromPointers],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      const pinch = pinchRef.current;
      if (pinch) {
        const t0 = pointersRef.current.get(pinch.idA);
        const t1 = pointersRef.current.get(pinch.idB);
        if (!t0 || !t1) return;
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const ratio = dist / pinch.startDist;
        const zFloat = pinch.startZ + Math.log2(Math.max(0.25, Math.min(4, ratio)));
        const z2 = clampZ(zFloat);
        const next = zoomAtScreenPoint(
          pinch.startCenterX,
          pinch.startCenterY,
          pinch.startZ,
          z2,
          pinch.midX,
          pinch.midY,
          size.w,
          size.h,
        );
        setUserOverride({ centerX: next.centerX, centerY: next.centerY, z: z2 });
        return;
      }

      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      setUserOverride((prev) => {
        const base = prev ?? autoView;
        return {
          centerX: base.centerX - dx,
          centerY: base.centerY - dy,
          z: base.z,
        };
      });
    },
    [autoView, size.h, size.w],
  );

  const onPointerUpOrCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const hadPinch = pinchRef.current != null;
    pointersRef.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (pinchRef.current) {
      const { idA, idB } = pinchRef.current;
      if (!pointersRef.current.has(idA) || !pointersRef.current.has(idB)) {
        pinchRef.current = null;
        setIsPinching(false);
      }
    }

    const d = dragRef.current;
    if (d?.pointerId === e.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
    }

    if (hadPinch && pinchRef.current == null && pointersRef.current.size === 1) {
      const pid = [...pointersRef.current.keys()][0]!;
      const pos = pointersRef.current.get(pid)!;
      dragRef.current = {
        pointerId: pid,
        lastX: pos.clientX,
        lastY: pos.clientY,
        moved: false,
      };
      setIsDragging(true);
      setDisableTileTransition(true);
    }

    if (pointersRef.current.size === 0) {
      requestAnimationFrame(() => setDisableTileTransition(false));
    }
  }, []);

  const zoomIn = useCallback(() => {
    applyZoom(z + 1, size.w / 2, size.h / 2);
  }, [applyZoom, size.h, size.w, z]);

  const zoomOut = useCallback(() => {
    applyZoom(z - 1, size.w / 2, size.h / 2);
  }, [applyZoom, size.h, size.w, z]);

  const resetFit = useCallback(() => {
    setDisableTileTransition(false);
    setUserOverride(null);
  }, []);

  const [active, setActive] = useState<ActiveMarker>(null);

  const mapAria = t("serverLocation.mapAria");

  return (
    <div
      ref={wrapRef}
      role="region"
      aria-label={mapAria}
      className="server-map-zoom-in server-map-root server-map-interactive relative z-0 h-[220px] w-full overflow-hidden rounded-lg bg-muted"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
    >
      <div
        className={`server-map-tile-plane absolute left-0 top-0 ${disableTileTransition || isDragging || isPinching ? "server-map-tile-plane--instant" : ""}`}
        style={{
          width: size.w,
          height: size.h,
          transform: `translate3d(${-originX}px, ${-originY}px, 0)`,
        }}
        aria-hidden
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={tileUrl(t.z, t.x, t.y)}
            alt=""
            width={TILE}
            height={TILE}
            className="pointer-events-none absolute max-w-none select-none"
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
          onPointerDown={(e) => e.stopPropagation()}
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
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setActive((a) => (a === "server" ? null : "server"))}
      >
        <div
          className="geo-marker-dot"
          style={{ background: "var(--speed-upload)" }}
        />
      </button>

      <div className="server-map-controls pointer-events-none absolute right-1 top-1 z-10 flex flex-col gap-1">
        <button
          type="button"
          className="server-map-control-btn pointer-events-auto"
          aria-label={t("serverLocation.mapZoomIn")}
          title={t("serverLocation.mapZoomIn")}
          disabled={z >= Z_MAX}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="server-map-control-btn pointer-events-auto"
          aria-label={t("serverLocation.mapZoomOut")}
          title={t("serverLocation.mapZoomOut")}
          disabled={z <= Z_MIN}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="server-map-control-btn pointer-events-auto"
          aria-label={t("serverLocation.mapResetFit")}
          title={t("serverLocation.mapResetFit")}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            resetFit();
          }}
        >
          <LocateFixed className="size-4" aria-hidden />
        </button>
      </div>

      {active ? (
        <div className="pointer-events-none absolute bottom-1 left-1 right-1 rounded-md border border-border bg-card/95 px-2 py-1.5 text-left text-card-foreground shadow-sm backdrop-blur-sm">
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
