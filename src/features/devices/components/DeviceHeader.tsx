import { Icon } from "@/shared/components/Icon";
import { Mono } from "@/shared/components/Mono";
import { useTranslation } from "react-i18next";
import type { DeviceDetails, DeviceInfo, DeviceStats } from "../types";
import { deviceName } from "../utils";
import { DeviceLiveStats } from "./DeviceLiveStats";
import { PhoneOutline } from "./PhoneOutline";

type DeviceHeaderProps = {
  device: DeviceInfo;
  details: DeviceDetails | null;
  stats?: DeviceStats | null;
  statsError?: string;
};

export function DeviceHeader({ device, details, stats, statsError }: DeviceHeaderProps) {
  const { t } = useTranslation();
  const facts = [
    details?.manufacturer,
    details?.androidVersion ? `Android ${details.androidVersion}` : null,
  ].filter(Boolean);

  return (
    <header className="flex items-start gap-6">
      <PhoneOutline />
      <div className="grid min-w-0 flex-1 gap-2">
        <h1 className="truncate text-[22px] font-semibold leading-tight">
          {deviceName(device) || t("devices.androidDevice")}
        </h1>
        {facts.length > 0 ? (
          <p className="text-[13px] text-muted">{facts.join(" · ")}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-faint">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Icon name="cable" size={14} />
            {t("common.usb")}
          </span>
          <Mono>{device.serial}</Mono>
        </div>
        <DeviceLiveStats
          stats={stats ?? null}
          error={statsError}
          batteryFallback={details?.batteryLevel}
        />
      </div>
    </header>
  );
}
