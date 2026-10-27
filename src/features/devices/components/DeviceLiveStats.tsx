import { Mono } from "@/shared/components/Mono";
import { useTranslation } from "react-i18next";
import type { DeviceStats } from "../types";

type DeviceLiveStatsProps = {
  stats: DeviceStats | null;
  error?: string;
  batteryFallback?: number | null;
};

function fmtRam(used?: number | null, total?: number | null) {
  if (used == null || total == null || total <= 0) return null;
  const pct = Math.round((used / total) * 100);
  return `${pct}% · ${used}/${total} MB`;
}

/** Compact live metrics under the device header. */
export function DeviceLiveStats({ stats, error, batteryFallback }: DeviceLiveStatsProps) {
  const { t } = useTranslation();

  if (error) {
    return <p className="text-xs text-rec">{error}</p>;
  }

  const cpu = stats?.cpuPercent != null ? `${Math.round(stats.cpuPercent)}%` : null;
  const ram = fmtRam(stats?.ramUsedMb, stats?.ramTotalMb);
  const level = stats?.batteryLevel ?? batteryFallback;
  const status = stats?.batteryStatus;
  let bat: string | null = null;
  if (level != null) {
    const tag =
      status === "charging"
        ? t("stats.charging")
        : status === "full"
          ? t("stats.full")
          : status === "discharging"
            ? t("stats.discharging")
            : null;
    bat = tag ? `${level}% ${tag}` : `${level}%`;
  }

  const items = [
    cpu ? { label: t("stats.cpu"), value: cpu } : null,
    ram ? { label: t("stats.ram"), value: ram } : null,
    bat ? { label: t("stats.battery"), value: bat } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) {
    return <p className="text-xs text-faint">{t("stats.loading")}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg px-2.5 py-1 text-[11px]"
        >
          <span className="text-muted">{item.label}</span>
          <Mono className="text-fg">{item.value}</Mono>
        </span>
      ))}
      {stats?.topProcess ? (
        <span className="max-w-50 truncate text-[11px] text-faint" title={stats.topProcess}>
          {t("stats.topProcess", { name: stats.topProcess })}
        </span>
      ) : null}
    </div>
  );
}
