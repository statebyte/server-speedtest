"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpeedTest } from "@/hooks/use-speed-test";
import { ControlButtons } from "@/components/speed-test/control-buttons";
import { DownloadMeasurements } from "@/components/speed-test/download-measurements";
import { LatencyMeasurements } from "@/components/speed-test/latency-measurements";
import { NetworkQualityScore } from "@/components/speed-test/network-quality-score";
import { PacketLossMeasurements } from "@/components/speed-test/packet-loss-measurements";
import { RealtimeGraph } from "@/components/speed-test/realtime-graph";
import { ServerLocation } from "@/components/speed-test/server-location";
import { SpeedSummary } from "@/components/speed-test/speed-summary";
import { UploadMeasurements } from "@/components/speed-test/upload-measurements";

export function SpeedTest() {
  const { results, running, paused, started, error, play, pause, resume, restart } =
    useSpeedTest();

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your Internet Speed</h1>
        <p className="text-sm text-muted-foreground">
          Measurements are taken against <span className="font-medium">this server</span>{" "}
          (the host running this app).
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Live results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!started ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <p className="max-w-md text-center text-sm text-muted-foreground">
                  Press Start to run download, upload, latency, jitter, and packet loss checks
                  against this deployment.
                </p>
                <Button size="lg" className="min-w-48" onClick={play}>
                  Start
                </Button>
              </div>
            ) : (
              <>
                <SpeedSummary results={results} />
                <RealtimeGraph results={results} />
                <ControlButtons
                  running={running}
                  paused={paused}
                  started={started}
                  onPause={pause}
                  onResume={resume}
                  onRestart={restart}
                />
              </>
            )}
          </CardContent>
        </Card>

        <ServerLocation />
      </div>

      {started ? (
        <>
          <NetworkQualityScore scores={results.networkQuality} />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                <DownloadMeasurements points={results.downloadPoints} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                <UploadMeasurements points={results.uploadPoints} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardContent className="space-y-8 pt-6">
                <LatencyMeasurements results={results} />
                <PacketLossMeasurements packetLoss={results.packetLoss} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
