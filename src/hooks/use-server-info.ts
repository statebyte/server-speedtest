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
    setError(null);
    void fetch("/api/server-info", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server info failed (${res.status})`);
        }
        return (await res.json()) as ServerInfo;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load server info");
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
