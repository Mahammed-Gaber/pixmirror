import { Icon } from "@/shared/components/Icon";
import { IconButton } from "@/shared/components/IconButton";
import { Mono } from "@/shared/components/Mono";
import { StatusDot } from "@/shared/components/StatusDot";
import { useTranslation } from "react-i18next";
import { useNotice, type NoticeTone } from "@/shared/notice";
import { cn } from "@/shared/utils/cn";
import { shortPath } from "@/shared/utils/format";

const DOT_TONE: Record<NoticeTone, "ok" | "rec" | "idle"> = {
  success: "ok",
  error: "rec",
  info: "idle",
};

type StatusBarProps = {
  /** Unique phones ready (USB+Wi‑Fi of same phone counts as 1). */
  phoneCount: number;
  /** Selected phone battery % when known. */
  batteryLevel?: number | null;
  batteryCharging?: boolean;
  adbVersion: string;
  saveDirectory: string;
  onOpenSaveDirectory: () => void;
  onOpenSettings: () => void;
};

export function StatusBar({
  phoneCount,
  batteryLevel,
  batteryCharging,
  adbVersion,
  saveDirectory,
  onOpenSaveDirectory,
  onOpenSettings,
}: StatusBarProps) {
  const { notice, dismiss } = useNotice();
  const { t } = useTranslation();

  const batteryLabel =
    batteryLevel != null
      ? batteryCharging
        ? t("status.batteryCharging", { level: batteryLevel })
        : t("status.battery", { level: batteryLevel })
      : null;

  return (
    <footer className="flex min-h-8 shrink-0 items-center gap-4 border-t border-line bg-surface py-1 ps-3 pe-1.5 text-[11px] text-muted">
      <div className="flex min-w-0 flex-1 items-center gap-2" aria-live="polite">
        {notice ? (
          <>
            <StatusDot tone={DOT_TONE[notice.tone]} />
            <span
              title={notice.text}
              className={cn("line-clamp-2 text-xs", notice.tone === "error" ? "text-rec" : "text-fg")}
            >
              {notice.text}
            </span>
            {notice.action ? (
              <button
                type="button"
                onClick={() => {
                  notice.action?.run();
                  dismiss();
                }}
                className="shrink-0 text-xs text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
              >
                {notice.action.label}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <StatusDot tone={phoneCount ? "ok" : "idle"} />
            <span>
              {phoneCount
                ? t("status.phonesReady", { count: phoneCount })
                : t("status.waitingDevice")}
            </span>
            {batteryLabel ? (
              <>
                <span className="text-faint">·</span>
                <span className="text-fg">{batteryLabel}</span>
              </>
            ) : null}
          </>
        )}
      </div>

      {adbVersion ? <Mono className="shrink-0 text-faint">{adbVersion}</Mono> : null}

      <button
        type="button"
        onClick={onOpenSaveDirectory}
        title={saveDirectory}
        className="flex max-w-[220px] shrink-0 items-center gap-1.5 hover:text-fg"
      >
        <Icon name="folder" size={13} />
        <Mono className="truncate">{shortPath(saveDirectory)}</Mono>
      </button>

      <IconButton
        icon="sliders"
        label={t("common.settings")}
        onClick={onOpenSettings}
      />
    </footer>
  );
}
