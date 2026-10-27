import { useEffect, useRef } from "react";

import { usePersistentState } from "@/shared/hooks/usePersistentState";
import type { DeviceInfo } from "@/features/devices/types";
import { devicePrefsKey } from "@/features/devices/utils";
import type { PerformancePreset } from "../types";

export type DevicePrefs = {
  preset: PerformancePreset;
  screenOff: boolean;
};

type PrefsMap = Record<string, DevicePrefs>;

const STORAGE_KEY = "mirror.devicePrefs";
const DEFAULTS: DevicePrefs = { preset: "high", screenOff: false };

function readMap(): PrefsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrefsMap) : {};
  } catch {
    return {};
  }
}

export function useDevicePrefs(device: DeviceInfo | null) {
  const [, setMap] = usePersistentState<PrefsMap>(STORAGE_KEY, {});
  const [preset, setPreset] = usePersistentState<PerformancePreset>("mirror.preset", "high");
  const [screenOff, setScreenOff] = usePersistentState("mirror.screenOff", false);
  const skipSave = useRef(true);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!device) return;
    const key = devicePrefsKey(device);
    if (lastKey.current === key) return;
    lastKey.current = key;
    skipSave.current = true;

    const saved = readMap()[key] ?? DEFAULTS;
    setPreset(saved.preset);
    setScreenOff(saved.screenOff);
  }, [device, setPreset, setScreenOff]);

  useEffect(() => {
    if (!device) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const key = devicePrefsKey(device);
    setMap((prev) => ({ ...prev, [key]: { preset, screenOff } }));
  }, [device, preset, screenOff, setMap]);

  return { preset, setPreset, screenOff, setScreenOff };
}
