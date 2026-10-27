import { useCallback, useEffect, useMemo, useState } from "react";

import { useInterval } from "@/shared/hooks/useInterval";
import { usePersistentState } from "@/shared/hooks/usePersistentState";
import { te } from "@/shared/i18n";
import { listDevices } from "../api";
import type { DeviceInfo } from "../types";
import { isReady, resolveSelectedSerial } from "../utils";

const POLL_MS = 3000;

export function useDevices(enabled: boolean) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedSerial, setSelectedSerial] = usePersistentState("devices.selected", "");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const list = await listDevices();
      setDevices(list);
      setSelectedSerial((prev) => resolveSelectedSerial(list, prev));
      setError("");
    } catch (e) {
      setError(te(e));
    } finally {
      setLoaded(true);
    }
  }, [setSelectedSerial]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  useInterval(() => void refresh(), enabled ? POLL_MS : null);

  const ready = useMemo(() => devices.filter(isReady), [devices]);
  const pending = useMemo(() => devices.filter((d) => !isReady(d)), [devices]);
  const selected = ready.find((d) => d.serial === selectedSerial) ?? null;

  function clearSelection() {
    setSelectedSerial("");
  }

  return {
    ready,
    pending,
    selected,
    select: setSelectedSerial,
    clearSelection,
    refresh,
    loaded,
    error,
  };
}
