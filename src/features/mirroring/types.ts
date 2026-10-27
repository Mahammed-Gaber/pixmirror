export type PerformancePreset = "high" | "gaming" | "eco";

export type MirrorOptions = {
  serial: string;
  preset: PerformancePreset;
  turnScreenOff: boolean;
  stayAwake: boolean;
  windowTitle: string;
};

export type MirrorStatus = {
  active: boolean;
  serial: string | null;
  recording: boolean;
  /** Unix epoch ms. */
  recordingStartedAt: number | null;
  recordingPath: string | null;
};
