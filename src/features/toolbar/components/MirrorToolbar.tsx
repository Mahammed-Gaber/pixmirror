import { IconButton } from "@/shared/components/IconButton";
import type { IconName } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { RecordingClock } from "@/features/capture";
import type { DeviceKey } from "@/features/devices";

type Tone = "ok" | "rec" | undefined;

type MirrorToolbarProps = {
  recording: boolean;
  recordingStartedAt: number | null;
  busy: { screenshot: boolean; record: boolean; stop: boolean };
  toneFor: (id: string) => Tone;
  onScreenshot: () => void;
  onToggleRecord: () => void;
  onKey: (key: DeviceKey) => void;
  onOpenFolder: () => void;
  onMinimize: () => void;
  onStop: () => void;
};

function Divider() {
  return <span className="my-1 h-px w-7 bg-line-strong" />;
}

export function MirrorToolbar({
  recording,
  recordingStartedAt,
  busy,
  toneFor,
  onScreenshot,
  onToggleRecord,
  onKey,
  onOpenFolder,
  onMinimize,
  onStop,
}: MirrorToolbarProps) {
  const { t } = useTranslation();

  const navKeys: { key: DeviceKey; icon: IconName; label: string }[] = [
    { key: "back", icon: "back", label: t("toolbar.back") },
    { key: "home", icon: "home", label: t("toolbar.home") },
    { key: "recents", icon: "recents", label: t("toolbar.recents") },
  ];

  const hardwareKeys: { key: DeviceKey; icon: IconName; label: string }[] = [
    { key: "volume_up", icon: "volumeUp", label: t("toolbar.volumeUp") },
    { key: "volume_down", icon: "volumeDown", label: t("toolbar.volumeDown") },
    { key: "power", icon: "power", label: t("toolbar.power") },
  ];

  return (
    <nav
      aria-label={t("toolbar.aria")}
      className="flex h-full flex-col overflow-hidden border border-line bg-surface"
    >
      <div className="toolbar-scroll flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain py-2">
        <IconButton
          size="lg"
          icon="camera"
          label={t("toolbar.screenshot")}
          tone={toneFor("screenshot")}
          disabled={busy.screenshot}
          onClick={onScreenshot}
        />

        <div className="flex flex-col items-center gap-1">
          <IconButton
            size="lg"
            icon={recording ? "stop" : "record"}
            label={recording ? t("toolbar.stopRecord") : t("toolbar.record")}
            tone={recording ? "rec" : (toneFor("record") ?? "default")}
            disabled={busy.record}
            onClick={onToggleRecord}
            className={recording ? undefined : "[&>svg]:text-rec/80"}
          />
          {recording && recordingStartedAt ? <RecordingClock startedAt={recordingStartedAt} /> : null}
          {busy.record ? <span className="size-1.5 animate-pulse rounded-full bg-rec" /> : null}
        </div>

        <Divider />
        {navKeys.map((k) => (
          <IconButton key={k.key} size="lg" icon={k.icon} label={k.label} onClick={() => onKey(k.key)} />
        ))}

        <Divider />
        {hardwareKeys.map((k) => (
          <IconButton key={k.key} size="lg" icon={k.icon} label={k.label} onClick={() => onKey(k.key)} />
        ))}

        <IconButton size="lg" icon="folder" label={t("toolbar.openFolder")} onClick={onOpenFolder} />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-line py-1.5">
        <IconButton size="lg" icon="minimize" label={t("toolbar.minimize")} onClick={onMinimize} />
        <IconButton
          size="lg"
          icon="close"
          label={t("toolbar.stop")}
          tone="danger"
          disabled={busy.stop}
          onClick={onStop}
        />
      </div>
    </nav>
  );
}
