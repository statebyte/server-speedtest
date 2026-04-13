"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerInfo } from "@/hooks/use-server-info";
import type { ServerMapEndpoint } from "@/components/speed-test/server-map-inner";

const ServerMapInner = dynamic(
  () =>
    import("@/components/speed-test/server-map-inner").then((m) => m.ServerMapInner),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-muted" /> },
);

export function ServerLocation() {
  const { t } = useTranslation();
  const { data, error } = useServerInfo();

  const server: ServerMapEndpoint = useMemo(() => {
    const serverLat = data?.serverLat ?? 52.37;
    const serverLon = data?.serverLon ?? 4.9;
    const serverTitle =
      data?.serverCity && data?.serverCountry
        ? `${data.serverCity}, ${data.serverCountry}`
        : data?.serverHostname ?? t("serverLocation.mapFallback");
    return {
      lat: serverLat,
      lon: serverLon,
      title: serverTitle,
      ip: data?.serverIp ?? null,
    };
  }, [data, t]);

  const client: ServerMapEndpoint | null = useMemo(() => {
    if (
      data?.clientLat == null ||
      data?.clientLon == null ||
      !Number.isFinite(data.clientLat) ||
      !Number.isFinite(data.clientLon)
    ) {
      return null;
    }
    const title =
      data.clientCity && data.clientCountry
        ? `${data.clientCity}, ${data.clientCountry}`
        : data.clientIp ?? "";
    return {
      lat: data.clientLat,
      lon: data.clientLon,
      title,
      ip: data.clientIp ?? null,
    };
  }, [data]);

  const errorMsg = error
    ? error.startsWith("SERVER_INFO:")
      ? t("errors.serverInfo", { status: error.slice("SERVER_INFO:".length) })
      : t("errors.generic")
    : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("serverLocation.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMsg ? <p className="text-sm text-destructive">{errorMsg}</p> : null}
        <ServerMapInner
          server={server}
          client={client}
          youLabel={t("serverLocation.you")}
          serverLabel={t("serverLocation.serverMarker")}
          midpointTitle={t("serverLocation.midpointHint")}
        />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("serverLocation.connectedVia")}</dt>
            <dd className="font-medium">{data?.protocol?.toUpperCase() ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("serverLocation.server")}</dt>
            <dd className="max-w-[55%] text-right font-medium">
              {data?.serverCity && data?.serverCountry
                ? `${data.serverCity}, ${data.serverCountry}`
                : data?.serverHostname ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("serverLocation.hostname")}</dt>
            <dd className="max-w-[55%] truncate text-right font-mono text-xs">
              {data?.serverHostname ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("serverLocation.yourIp")}</dt>
            <dd className="font-mono text-xs font-medium">{data?.clientIp ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("serverLocation.serverIp")}</dt>
            <dd className="font-mono text-xs font-medium">{data?.serverIp ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
