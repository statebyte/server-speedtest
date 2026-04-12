"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpeedTestEngine } from "@/lib/speed-test-engine";
import type { SpeedTestResults } from "@/types";

export function useSpeedTest(): {
  readonly results: SpeedTestResults;
  readonly running: boolean;
  readonly paused: boolean;
  readonly started: boolean;
  readonly error: string | null;
  readonly play: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly restart: () => void;
} {
  const engineRef = useRef<SpeedTestEngine | null>(null);
  const [results, setResults] = useState<SpeedTestResults>(() =>
    new SpeedTestEngine().getResults(),
  );
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const engine = new SpeedTestEngine();
    engine.onRunningChange = (isRunning) => {
      setRunning(isRunning);
      setPaused(engine.isPaused);
    };
    engine.onResultsChange = () => {
      setResults(engine.getResults());
      setPaused(engine.isPaused);
    };
    engine.onFinish = () => {
      setResults(engine.getResults());
      setPaused(false);
    };
    engine.onError = (message) => setError(message);
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    setError(null);
    setStarted(true);
    void engineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const restart = useCallback(() => {
    setError(null);
    setStarted(true);
    engineRef.current?.restart();
  }, []);

  return { results, running, paused, started, error, play, pause, resume, restart };
}
