export type DeviceInfo = {
  serial: string;
  /** adb state: device | unauthorized | offline | ... */
  state: string;
  model?: string | null;
  product?: string | null;
};

export type DeviceDetails = {
  androidVersion?: string | null;
  manufacturer?: string | null;
  batteryLevel?: number | null;
};

export type DeviceStats = {
  cpuPercent?: number | null;
  ramUsedMb?: number | null;
  ramTotalMb?: number | null;
  batteryLevel?: number | null;
  batteryStatus?: string | null;
  topProcess?: string | null;
};

export type DeviceKey = "back" | "home" | "recents" | "volume_up" | "volume_down" | "power";
