import type { DeviceInfo } from "./types";
import { isReady } from "./utils";

export function countReadyPhones(devices: DeviceInfo[]): number {
  return devices.filter(isReady).length;
}
