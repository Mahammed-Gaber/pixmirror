import { call } from "@/shared/lib/invoke";
import type { DeviceDetails, DeviceInfo, DeviceKey, DeviceStats } from "./types";

export const getAdbVersion = () => call<string>("get_adb_version");

export const listDevices = () => call<DeviceInfo[]>("list_devices");

export const getDeviceDetails = (serial: string) =>
  call<DeviceDetails>("get_device_details", { serial });

export const getDeviceStats = (serial: string) =>
  call<DeviceStats>("get_device_stats", { serial });

export const sendKey = (serial: string, key: DeviceKey) => call<void>("send_key", { serial, key });
