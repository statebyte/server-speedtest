"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useServerInfo } from "@/hooks/use-server-info";
import type { ServerMapEndpoint } from "@/components/speed-test/server-map-inner";
import { IpRevealCopyRow } from "@/components/speed-test/ip-reveal-copy-row";

const ServerMapInner = dynamic(
  () =>
    import("@/components/speed-test/server-map-inner").then((m) => m.ServerMapInner),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-muted" /> },
);

export function ServerLocation() {
  const { t } = useTranslation();
  const { data, error } = useServerInfo();

  const server: ServerMapEndpoint | null = useMemo(() => {
    if (!data) return null;
    const serverLat = data.serverLat;
    const serverLon = data.serverLon;
    if (
      serverLat == null ||
      serverLon == null ||
      !Number.isFinite(serverLat) ||
      !Number.isFinite(serverLon) ||
      Math.abs(serverLat) > 90 ||
      Math.abs(serverLon) > 180
    ) {
      return null;
    }
    const serverTitle =
      data.serverCity && data.serverCountry
        ? `${data.serverCity}, ${data.serverCountry}`
        : data.serverHostname || t("serverLocation.mapFallback");
    return {
      lat: serverLat,
      lon: serverLon,
      title: serverTitle,
      ip: data.serverIp ?? null,
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

  const mapRemountKey = useMemo(() => {
    if (!server) return "map-off";
    return `${server.lat.toFixed(5)},${server.lon.toFixed(5)},${client ? `${client.lat.toFixed(5)},${client.lon.toFixed(5)}` : ""}`;
  }, [client, server]);

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
        {!data && !errorMsg ? (
          <div className="h-[220px] animate-pulse rounded-lg bg-muted" aria-hidden />
        ) : null}
        {data && server == null ? (
          <p className="text-sm text-muted-foreground">{t("serverLocation.mapUnavailable")}</p>
        ) : null}
        {data && server != null ? (
          <ServerMapInner
            key={mapRemountKey}
            server={server}
            client={client}
            youLabel={t("serverLocation.you")}
            serverLabel={t("serverLocation.serverMarker")}
            midpointTitle={t("serverLocation.midpointHint")}
          />
        ) : null}
        <div className="space-y-4 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("serverLocation.connectedVia")}</dt>
              <dd className="font-medium">{data?.protocol?.toUpperCase() ?? "—"}</dd>
            </div>
          </dl>
          <Separator />
          <section className="space-y-2" aria-labelledby="server-location-client-heading">
            <h3
              id="server-location-client-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("serverLocation.sectionYou")}
            </h3>
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">{t("serverLocation.yourIp")}</dt>
                <dd className="flex min-w-0 justify-end text-right">
                  <IpRevealCopyRow
                    ip={data?.clientIp ?? null}
                    blur
                    revealLabel={t("serverLocation.revealIp")}
                    hideLabel={t("serverLocation.hideIp")}
                    copyLabel={t("serverLocation.copyIp")}
                    copiedLabel={t("serverLocation.copiedIp")}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("serverLocation.yourAsn")}</dt>
                <dd className="max-w-[55%] text-right font-mono text-xs font-medium">
                  {data?.clientAsn ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("serverLocation.yourOrg")}</dt>
                <dd className="max-w-[55%] text-right text-xs font-medium">
                  {data?.clientOrg ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
          <Separator />
          <section className="space-y-2" aria-labelledby="server-location-server-heading">
            <h3
              id="server-location-server-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t("serverLocation.sectionServer")}
            </h3>
            <dl className="space-y-2">
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
                <dt className="shrink-0 text-muted-foreground">{t("serverLocation.serverIp")}</dt>
                <dd className="flex min-w-0 justify-end text-right">
                  <IpRevealCopyRow
                    ip={data?.serverIp ?? null}
                    revealLabel={t("serverLocation.revealIp")}
                    hideLabel={t("serverLocation.hideIp")}
                    copyLabel={t("serverLocation.copyIp")}
                    copiedLabel={t("serverLocation.copiedIp")}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("serverLocation.serverAsn")}</dt>
                <dd className="max-w-[55%] text-right font-mono text-xs font-medium">
                  {data?.serverAsn ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("serverLocation.serverOrg")}</dt>
                <dd className="max-w-[55%] text-right text-xs font-medium">
                  {data?.serverOrg ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
