import { useTranslation } from "react-i18next";
import { useNotice } from "@/shared/notice";
import { revealCapture } from "../api";

function fileName(path: string) {
  return path.replace(/^.*[/\\]/, "") || path;
}

export function useCaptureNotice() {
  const { notify, notifyError } = useNotice();
  const { t } = useTranslation();

  function saved(kind: "screenshot" | "recording", path: string) {
    const kindLabel =
      kind === "screenshot" ? t("capture.screenshot") : t("capture.recording");
    notify({
      tone: "success",
      text: t("capture.saved", { kind: kindLabel, name: fileName(path) }),
      action: {
        label: t("capture.reveal"),
        run: () => revealCapture(path).catch(notifyError),
      },
    });
  }

  return { saved };
}
