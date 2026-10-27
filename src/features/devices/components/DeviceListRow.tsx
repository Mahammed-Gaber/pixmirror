import { useTranslation } from "react-i18next";

import { StatusDot } from "@/shared/components/StatusDot";
import { cn } from "@/shared/utils/cn";
import type { DeviceInfo } from "../types";
import { deviceName, isReady, stateLabelKey } from "../utils";

type DeviceListRowProps = {
  device: DeviceInfo;
  selected: boolean;
  onSelect: (serial: string) => void;
};

export function DeviceListRow({ device, selected, onSelect }: DeviceListRowProps) {
  const { t } = useTranslation();
  const ready = isReady(device);
  const displayName = deviceName(device) || t("devices.androidDevice");
  const stateKey = stateLabelKey(device.state);
  const stateText = stateKey.startsWith("devices.") ? t(stateKey) : stateKey;

  return (
    <div
      className={cn(
        "group relative mx-1 rounded-md px-2 py-2 transition-colors",
        selected ? "bg-raised ring-1 ring-line-strong" : ready && "hover:bg-hover",
      )}
    >
      {selected ? <span className="absolute inset-y-2 inset-s-0 w-0.5 rounded-e-full bg-fg" /> : null}

      <button
        type="button"
        disabled={!ready}
        onClick={() => onSelect(device.serial)}
        className={cn(
          "flex w-full min-w-0 items-center gap-2.5 px-2 py-0.5 text-start",
          !ready && "cursor-default",
        )}
      >
        <StatusDot tone={ready ? "ok" : "warn"} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[13px]", ready ? "text-fg" : "text-muted")}>
            {displayName}
          </span>
          {!ready ? (
            <span className="block text-[11px] leading-snug text-warn">
              {stateText}
              {device.state === "unauthorized" ? t("devices.acceptAlways") : null}
            </span>
          ) : (
            <span className="block text-[11px] text-muted">{t("common.usb")}</span>
          )}
        </span>
      </button>
    </div>
  );
}
