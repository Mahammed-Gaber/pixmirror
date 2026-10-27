import type { MirrorStatus, PerformancePreset } from "./types";

type PresetDefinition = {
  value: PerformancePreset;
  /** i18n key under presets.* */
  labelKey: string;
  spec: string;
  /** i18n key under presets.* */
  descKey: string;
};

/** Specs must match `build_args` in `src-tauri/src/mirror/scrcpy.rs`. */
export const PRESETS: readonly PresetDefinition[] = [
  {
    value: "high",
    labelKey: "presets.high",
    spec: "native · 8 Mbps",
    descKey: "presets.highDesc",
  },
  {
    value: "gaming",
    labelKey: "presets.gaming",
    spec: "1280p · 60 fps · 8 Mbps",
    descKey: "presets.gamingDesc",
  },
  {
    value: "eco",
    labelKey: "presets.eco",
    spec: "1024p · 30 fps · 2 Mbps",
    descKey: "presets.ecoDesc",
  },
];

export const IDLE_STATUS: MirrorStatus = {
  active: false,
  serial: null,
  recording: false,
  recordingStartedAt: null,
  recordingPath: null,
};
