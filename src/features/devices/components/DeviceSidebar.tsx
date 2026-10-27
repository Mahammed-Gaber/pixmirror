import { useTranslation } from "react-i18next";

import { IconButton } from "@/shared/components/IconButton";
import { Mono } from "@/shared/components/Mono";
import type { DeviceInfo } from "../types";
import { DeviceListRow } from "./DeviceListRow";

type DeviceSidebarProps = {
  ready: DeviceInfo[];
  pending: DeviceInfo[];
  selectedSerial: string | null;
  onSelect: (serial: string) => void;
  onRefresh: () => void;
};

export function DeviceSidebar({
  ready,
  pending,
  selectedSerial,
  onSelect,
  onRefresh,
}: DeviceSidebarProps) {
  const { t } = useTranslation();
  const devices = [...ready, ...pending];
  const count = devices.length;

  return (
    <aside className="flex w-67 shrink-0 flex-col border-e border-line-strong/60 bg-surface">
      <div className="flex h-11 items-center gap-2 border-b border-line ps-4 pe-2">
        <span className="text-xs font-medium tracking-wide text-muted">{t("devices.title")}</span>
        <Mono className="text-[11px] text-faint">{count}</Mono>
        <IconButton
          icon="refresh"
          label={t("devices.refreshList")}
          onClick={onRefresh}
          className="ms-auto"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {count === 0 ? (
          <p className="px-4 py-3 text-xs text-faint">{t("devices.none")}</p>
        ) : (
          devices.map((device) => (
            <DeviceListRow
              key={device.serial}
              device={device}
              selected={device.serial === selectedSerial}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}
