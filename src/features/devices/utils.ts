import type { DeviceInfo } from "./types";

export const isReady = (device: DeviceInfo) => device.state === "device";

export const deviceName = (device: Pick<DeviceInfo, "model" | "product">) =>
  device.model || device.product || "";

export function resolveSelectedSerial(list: DeviceInfo[], previous: string): string {
  const ready = list.filter(isReady);
  if (!previous) return ready[0]?.serial ?? "";
  if (ready.some((d) => d.serial === previous)) return previous;
  return ready[0]?.serial ?? "";
}

export function devicePrefsKey(device: Pick<DeviceInfo, "serial" | "model" | "product">): string {
  const model = device.model?.trim().toLowerCase();
  const product = device.product?.trim().toLowerCase();
  if (model) return `model:${model}`;
  if (product) return `product:${product}`;
  return `serial:${device.serial}`;
}

const STATE_KEYS: Record<string, string> = {
  unauthorized: "devices.stateUnauthorized",
  offline: "devices.stateOffline",
  bootloader: "devices.stateBootloader",
  recovery: "devices.stateRecovery",
  sideload: "devices.stateSideload",
};

export const stateLabelKey = (state: string) => STATE_KEYS[state] ?? state;
