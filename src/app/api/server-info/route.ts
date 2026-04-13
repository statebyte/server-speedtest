import { hostname } from "node:os";
import { NextRequest, NextResponse } from "next/server";
import { APP_BRAND_TITLE, APP_VERSION } from "@/lib/app-identity";

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const ip = value.split(",")[0]?.trim();
  return ip || null;
}

function getClientIp(request: NextRequest): string | null {
  const chain = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-real-ip"),
    firstForwardedIp(request.headers.get("x-forwarded-for")),
    firstForwardedIp(request.headers.get("x-vercel-forwarded-for")),
  ];
  for (const raw of chain) {
    const ip = raw?.trim();
    if (ip) return ip;
  }
  return null;
}

function readCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAsn(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function formatOrg(...candidates: readonly (unknown)[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t.length > 0) return t;
    }
  }
  return null;
}

function isTruthyEnv(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

interface IpGeoDetails {
  readonly city: string | null;
  readonly country: string | null;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly asn: string | null;
  readonly org: string | null;
}

function emptyGeo(): IpGeoDetails {
  return { city: null, country: null, lat: null, lon: null, asn: null, org: null };
}

function mergeIpGeo(a: IpGeoDetails, b: IpGeoDetails): IpGeoDetails {
  const aOk = a.lat != null && a.lon != null;
  const bOk = b.lat != null && b.lon != null;
  const primary = aOk ? a : bOk ? b : a;
  const secondary = aOk ? b : bOk ? a : b;
  return {
    lat: primary.lat ?? secondary.lat,
    lon: primary.lon ?? secondary.lon,
    city: primary.city ?? secondary.city,
    country: primary.country ?? secondary.country,
    asn: a.asn ?? b.asn,
    org: a.org ?? b.org,
  };
}

async function fetchPublicIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? null;
  } catch {
    return null;
  }
}

async function geoFromIpwho(ip: string): Promise<IpGeoDetails> {
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return emptyGeo();
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      connection?: { asn?: number; org?: string; isp?: string };
    };
    if (data.success === false) {
      return emptyGeo();
    }
    const conn = data.connection;
    return {
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      lat: readCoord(data.latitude),
      lon: readCoord(data.longitude),
      asn: formatAsn(conn?.asn),
      org: formatOrg(conn?.org, conn?.isp),
    };
  } catch {
    return emptyGeo();
  }
}

/** Fallback when ipwho.is is unreachable or rate-limited from the host network. */
async function geoFromGeojs(ip: string): Promise<IpGeoDetails> {
  try {
    const res = await fetch(`https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return emptyGeo();
    const data = (await res.json()) as {
      city?: string;
      country?: string;
      latitude?: string | number;
      longitude?: string | number;
      asn?: string | number;
      organization?: string;
      organization_name?: string;
    };
    const lat = readCoord(data.latitude);
    const lon = readCoord(data.longitude);
    return {
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      lat,
      lon,
      asn: formatAsn(data.asn),
      org: formatOrg(data.organization_name, data.organization),
    };
  } catch {
    return emptyGeo();
  }
}

async function geoForIp(ip: string | null): Promise<IpGeoDetails> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return emptyGeo();
  }
  const [fromIpwho, fromGeojs] = await Promise.all([geoFromIpwho(ip), geoFromGeojs(ip)]);
  return mergeIpGeo(fromIpwho, fromGeojs);
}

export async function GET(request: NextRequest) {
  const serverHostname =
    process.env.SERVER_HOSTNAME?.trim() || hostname() || "localhost";
  const envIp = process.env.SERVER_PUBLIC_IP?.trim() || null;

  const publicIp = envIp ?? (await fetchPublicIp());
  const clientIp = getClientIp(request);
  const [geo, clientGeo] = await Promise.all([geoForIp(publicIp), geoForIp(clientIp)]);

  const hideServerIp = isTruthyEnv(process.env.SERVER_INFO_HIDE_SERVER_IP);
  const hideServerNetwork = isTruthyEnv(process.env.SERVER_INFO_HIDE_SERVER_ASN);

  return NextResponse.json({
    appBrand: APP_BRAND_TITLE,
    appVersion: APP_VERSION,
    serverHostname,
    serverIp: hideServerIp ? null : publicIp,
    serverCity: geo.city,
    serverCountry: geo.country,
    serverLat: geo.lat,
    serverLon: geo.lon,
    serverAsn: hideServerNetwork ? null : geo.asn,
    serverOrg: hideServerNetwork ? null : geo.org,
    clientIp,
    clientCity: clientGeo.city,
    clientCountry: clientGeo.country,
    clientLat: clientGeo.lat,
    clientLon: clientGeo.lon,
    clientAsn: clientGeo.asn,
    clientOrg: clientGeo.org,
    protocol: request.nextUrl.protocol.replace(":", ""),
  });
}
