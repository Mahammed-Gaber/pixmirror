import { Mono } from "@/shared/components/Mono";
import { StatusDot } from "@/shared/components/StatusDot";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import type { DeviceInfo } from "../types";

type ConnectGuideProps = {
  pending: DeviceInfo[];
  error?: string;
};

/** Shown when no device is ready; highlights the step the user is stuck on. */
export function ConnectGuide({ pending, error }: ConnectGuideProps) {
  const { t } = useTranslation();
  const unauthorized = pending.some((d) => d.state === "unauthorized");
  const offline = pending.some((d) => d.state === "offline");
  const activeStep = unauthorized ? 3 : -1;

  const steps = [
    { title: t("guide.step1Title"), body: t("guide.step1Body") },
    { title: t("guide.step2Title"), body: t("guide.step2Body") },
    { title: t("guide.step3Title"), body: t("guide.step3Body") },
    { title: t("guide.step4Title"), body: t("guide.step4Body") },
  ];

  const after = [t("guide.after1"), t("guide.after2"), t("guide.after3"), t("guide.after4")];

  return (
    <section className="mx-auto flex w-full max-w-110 flex-col gap-6 py-10">
      <div className="grid gap-1.5">
        <h1 className="text-[22px] font-semibold">{t("guide.title")}</h1>
        <p className="text-[13px] text-muted">{t("guide.subtitle")}</p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line">
        {steps.map((step, index) => {
          const done = index < activeStep;
          const active = index === activeStep;
          return (
            <li
              key={step.title}
              className={cn("flex gap-3.5 bg-surface px-4 py-3", active && "bg-warn/[0.07]")}
            >
              <Mono
                className={cn(
                  "mt-px text-xs",
                  active ? "text-warn" : done ? "text-ok" : "text-faint",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </Mono>
              <div className="grid gap-0.5">
                <span className={cn("text-[13px]", done ? "text-muted line-through" : "text-fg")}>
                  {step.title}
                </span>
                <span className="text-xs leading-relaxed text-muted">{step.body}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-2 rounded-md border border-line bg-surface px-4 py-3">
        <h2 className="text-[13px] font-medium text-fg">{t("guide.afterTitle")}</h2>
        <ul className="grid gap-1.5 text-xs leading-relaxed text-muted">
          {after.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-faint">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted">
        {error ? (
          <>
            <StatusDot tone="rec" />
            <span className="text-rec">{error}</span>
          </>
        ) : offline ? (
          <>
            <StatusDot tone="warn" />
            {t("guide.offlineHint")}
          </>
        ) : unauthorized ? (
          <>
            <StatusDot tone="warn" pulse />
            {t("guide.waitingAuth")}
          </>
        ) : (
          <>
            <StatusDot tone="idle" pulse />
            {t("guide.searching")}
          </>
        )}
      </p>
    </section>
  );
}
