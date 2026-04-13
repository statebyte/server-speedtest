"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

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

function endpointIcon(kind: "client" | "server"): L.DivIcon {
  const color = kind === "client" ? "var(--speed-download)" : "var(--speed-upload)";
  return L.divIcon({
    className: "geo-marker-wrap",
    html: `<div class="geo-marker-dot" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const midpointPulseIcon = L.divIcon({
  className: "geo-midpoint-wrap",
  html: '<div class="geo-midpoint-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -8],
});

function FlyToRoute({
  server,
  client,
}: Readonly<{
  server: ServerMapEndpoint;
  client: ServerMapEndpoint | null;
}>) {
  const map = useMap();

  useEffect(() => {
    const hasClient =
      client != null &&
      Number.isFinite(client.lat) &&
      Number.isFinite(client.lon) &&
      !(client.lat === server.lat && client.lon === server.lon);

    if (hasClient) {
      const b = L.latLngBounds(
        [client!.lat, client!.lon],
        [server.lat, server.lon],
      );
      if (b.isValid()) {
        map.flyToBounds(b, { padding: [36, 36], duration: 1.35, maxZoom: 6 });
        return;
      }
    }

    map.flyTo([server.lat, server.lon], 4, { duration: 1.1 });
  }, [map, server.lat, server.lon, client]);

  return null;
}

export function ServerMapInner({
  server,
  client,
  youLabel,
  serverLabel,
  midpointTitle,
}: ServerMapInnerProps) {
  const clientOk =
    client != null &&
    Number.isFinite(client.lat) &&
    Number.isFinite(client.lon) &&
    Math.abs(client.lat) <= 90 &&
    Math.abs(client.lon) <= 180;

  const linePositions = useMemo((): [number, number][] | null => {
    if (!clientOk || !client) return null;
    if (client.lat === server.lat && client.lon === server.lon) return null;
    return [
      [client.lat, client.lon],
      [server.lat, server.lon],
    ];
  }, [client, clientOk, server.lat, server.lon]);

  const midpoint = useMemo((): [number, number] | null => {
    if (!linePositions) return null;
    const [a, b] = linePositions;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }, [linePositions]);

  return (
    <MapContainer
      center={[server.lat, server.lon]}
      zoom={3}
      scrollWheelZoom={false}
      className="server-map-zoom-in z-0 h-[220px] w-full overflow-hidden rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToRoute server={server} client={clientOk ? client : null} />
      {linePositions ? (
        <Polyline
          positions={linePositions}
          pathOptions={{
            color: "hsl(var(--foreground) / 0.45)",
            weight: 2,
            dashArray: "6 8",
          }}
        />
      ) : null}
      {midpoint ? (
        <Marker position={midpoint} icon={midpointPulseIcon} interactive={false} title={midpointTitle} />
      ) : null}
      {clientOk && client ? (
        <Marker position={[client.lat, client.lon]} icon={endpointIcon("client")}>
          <Popup>
            <div className="text-sm font-medium">{youLabel}</div>
            {client.title ? <div className="text-xs opacity-90">{client.title}</div> : null}
            {client.ip ? <div className="font-mono text-xs">{client.ip}</div> : null}
          </Popup>
        </Marker>
      ) : null}
      <Marker position={[server.lat, server.lon]} icon={endpointIcon("server")}>
        <Popup>
          <div className="text-sm font-medium">{serverLabel}</div>
          {server.title ? <div className="text-xs opacity-90">{server.title}</div> : null}
          {server.ip ? <div className="font-mono text-xs">{server.ip}</div> : null}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
