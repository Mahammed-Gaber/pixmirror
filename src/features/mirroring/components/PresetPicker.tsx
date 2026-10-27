import { useMemo } from "react";

import { Mono } from "@/shared/components/Mono";
import { SegmentedControl } from "@/shared/components/SegmentedControl";
import { useTranslation } from "react-i18next";
import { PRESETS } from "../constants";
import type { PerformancePreset } from "../types";

type PresetPickerProps = {
  value: PerformancePreset;
  onChange: (preset: PerformancePreset) => void;
  disabled?: boolean;
};

export function PresetPicker({ value, onChange, disabled }: PresetPickerProps) {
  const { t } = useTranslation();
  const current = PRESETS.find((p) => p.value === value) ?? PRESETS[0];
  const options = useMemo(
    () => PRESETS.map((p) => ({ value: p.value, label: t(p.labelKey) })),
    [t],
  );

  return (
    <div className="grid gap-2">
      <span className="text-xs text-muted">{t("presets.label")}</span>
      <SegmentedControl
        label={t("presets.label")}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
        {t(current.descKey)}
        <Mono className="text-[11px] text-faint">{current.spec}</Mono>
      </p>
    </div>
  );
}
