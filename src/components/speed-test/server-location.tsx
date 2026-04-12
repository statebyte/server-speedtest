"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerInfo } from "@/hooks/use-server-info";

const ServerMapInner = dynamic(
  () =>
    import("@/components/speed-test/server-map-inner").then((m) => m.ServerMapInner),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-muted" /> },
);

export function ServerLocation() {
  const { data, error } = useServerInfo();

  const lat = data?.serverLat ?? 52.37;
  const lon = data?.serverLon ?? 4.9;
  const title =
    data?.serverCity && data?.serverCountry
      ? `${data.serverCity}, ${data.serverCountry}`
      : data?.serverHostname ?? "Server";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Server Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        <ServerMapInner lat={lat} lon={lon} title={title} />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Connected via</dt>
            <dd className="font-medium">{data?.protocol?.toUpperCase() ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Server</dt>
            <dd className="max-w-[55%] text-right font-medium">
              {data?.serverCity && data?.serverCountry
                ? `${data.serverCity}, ${data.serverCountry}`
                : data?.serverHostname ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Hostname</dt>
            <dd className="max-w-[55%] truncate text-right font-mono text-xs">
              {data?.serverHostname ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Your IP</dt>
            <dd className="font-mono text-xs font-medium">{data?.clientIp ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Server IP</dt>
            <dd className="font-mono text-xs font-medium">{data?.serverIp ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
