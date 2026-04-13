"use client";

import { useEffect, useState } from "react";
import type { ServerInfo } from "@/types";

export function useServerInfo(): {
  readonly data: ServerInfo | null;
  readonly error: string | null;
  readonly reload: () => void;
} {
  const [data, setData] = useState<ServerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/server-info", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        setError(null);
        if (!res.ok) {
          throw new Error(`SERVER_INFO:${res.status}`);
        }
        return (await res.json()) as ServerInfo;
      })
      .then((json) => {
        if (!cancelled && json != null) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "NETWORK";
          setError(msg.startsWith("SERVER_INFO:") || msg === "NETWORK" ? msg : "NETWORK");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    data,
    error,
    reload: () => setNonce((n) => n + 1),
  };
}
