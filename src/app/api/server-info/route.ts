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

async function geoForIp(
  ip: string | null,
): Promise<{ city: string | null; country: string | null; lat: number | null; lon: number | null }> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return { city: null, country: null, lat: null, lon: null };
  }
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { city: null, country: null, lat: null, lon: null };
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
    if (data.success === false) {
      return { city: null, country: null, lat: null, lon: null };
    }
    return {
      city: data.city ?? null,
      country: data.country ?? null,
      lat: readCoord(data.latitude),
      lon: readCoord(data.longitude),
    };
  } catch {
    return { city: null, country: null, lat: null, lon: null };
  }
}

export async function GET(request: NextRequest) {
  const serverHostname =
    process.env.SERVER_HOSTNAME?.trim() || hostname() || "localhost";
  const envIp = process.env.SERVER_PUBLIC_IP?.trim() || null;

  const publicIp = envIp ?? (await fetchPublicIp());
  const clientIp = getClientIp(request);
  const [geo, clientGeo] = await Promise.all([geoForIp(publicIp), geoForIp(clientIp)]);

  return NextResponse.json({
    appBrand: APP_BRAND_TITLE,
    appVersion: APP_VERSION,
    serverHostname,
    serverIp: publicIp,
    serverCity: geo.city,
    serverCountry: geo.country,
    serverLat: geo.lat,
    serverLon: geo.lon,
    clientIp,
    clientCity: clientGeo.city,
    clientCountry: clientGeo.country,
    clientLat: clientGeo.lat,
    clientLon: clientGeo.lon,
    protocol: request.nextUrl.protocol.replace(":", ""),
  });
}
