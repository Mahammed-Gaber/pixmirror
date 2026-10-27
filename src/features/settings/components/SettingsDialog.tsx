import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/components/Button";
import { IconButton } from "@/shared/components/IconButton";
import { Mono } from "@/shared/components/Mono";
import {
  getLocalePreference,
  setLocalePreference,
  type LocalePreference,
} from "@/shared/i18n";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  saveDirectory: string;
  onChooseDirectory: () => void;
  onOpenDirectory: () => void;
  adbVersion: string;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-line px-5 py-4 last:border-b-0">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

const LOCALE_OPTIONS: { value: LocalePreference; labelKey: string }[] = [
  { value: "system", labelKey: "locale.system" },
  { value: "ar", labelKey: "locale.ar" },
  { value: "en", labelKey: "locale.en" },
];

export function SettingsDialog({
  open,
  onClose,
  saveDirectory,
  onChooseDirectory,
  onOpenDirectory,
  adbVersion,
}: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  const [preference, setPreference] = useState(getLocalePreference);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-115 rounded-lg border border-line-strong bg-surface p-0 text-fg backdrop:bg-black/50"
    >
      <div className="flex h-11 items-center border-b border-line ps-5 pe-2">
        <h2 className="text-[13px] font-medium">{t("settings.title")}</h2>
        <IconButton
          icon="close"
          label={t("common.close")}
          onClick={onClose}
          className="ms-auto"
        />
      </div>

      <Row label={t("locale.label")}>
        <div className="flex flex-wrap gap-1.5">
          {LOCALE_OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setLocalePreference(opt.value);
                  setPreference(opt.value);
                }}
                className={
                  active
                    ? "h-8 rounded-md bg-fg px-3 text-[13px] text-bg"
                    : "h-8 rounded-md border border-line-strong px-3 text-[13px] text-muted hover:bg-raised hover:text-fg"
                }
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-faint">{t("locale.hint")}</span>
      </Row>

      <Row label={t("settings.saveDir")}>
        <Mono className="block truncate rounded border border-line bg-bg px-2.5 py-2 text-xs text-muted">
          {saveDirectory || "…"}
        </Mono>
        <div className="flex gap-2">
          <Button onClick={onChooseDirectory}>{t("common.change")}</Button>
          <Button icon="folder" onClick={onOpenDirectory}>
            {t("common.open")}
          </Button>
        </div>
        <span className="text-xs text-faint">{t("settings.saveDirHint")}</span>
      </Row>

      <Row label={t("settings.tools")}>
        <Mono className="text-xs text-muted">{adbVersion || t("settings.adbUnavailable")}</Mono>
      </Row>
    </dialog>
  );
}
