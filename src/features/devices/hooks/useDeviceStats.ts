import { useCallback, useEffect, useRef, useState } from "react";

import { useInterval } from "@/shared/hooks/useInterval";
import { te } from "@/shared/i18n";
import { getDeviceStats } from "../api";
import type { DeviceStats } from "../types";

const POLL_MS = 2000;
const FIRST_FETCH_DELAY_MS = 500;
const FAIL_BEFORE_SHOW = 3;

/** USB handshake / auth races — keep showing loading, not a red banner. */
function isTransientAdbError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("not found") ||
    m.includes("no_device") ||
    m.includes("offline") ||
    m.includes("closed") ||
    m.includes("authoriz") || // authorizing / unauthorized
    m.includes("broken pipe") ||
    m.includes("connection reset") ||
    m.includes("protocol fault") ||
    m.includes("---mem---") // misclassified stats dump
  );
}

/** Polls phone CPU / RAM / battery while `serial` is set and `enabled`. */
export function useDeviceStats(serial: string | null, enabled: boolean) {
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [error, setError] = useState("");
  const failsRef = useRef(0);
  const hadStatsRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!serial) {
      setStats(null);
      setError("");
      failsRef.current = 0;
      hadStatsRef.current = false;
      return;
    }
    try {
      setStats(await getDeviceStats(serial));
      failsRef.current = 0;
      hadStatsRef.current = true;
      setError("");
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      failsRef.current += 1;
      if (isTransientAdbError(raw)) {
        if (!hadStatsRef.current || failsRef.current < FAIL_BEFORE_SHOW) {
          setError("");
          return;
        }
      }
      setError(te(raw));
    }
  }, [serial]);

  useEffect(() => {
    failsRef.current = 0;
    hadStatsRef.current = false;
    setStats(null);
    setError("");
    if (!enabled || !serial) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      if (!cancelled) void refresh();
    }, FIRST_FETCH_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [enabled, serial, refresh]);

  useInterval(() => void refresh(), enabled && serial ? POLL_MS : null);

  return { stats, error, refresh };
}
