import { useState } from "react";

import { useNotice } from "@/shared/notice";
import { takeScreenshot } from "../api";
import { useCaptureNotice } from "./useCaptureNotice";

export function useScreenshot() {
  const [busy, setBusy] = useState(false);
  const { notifyError } = useNotice();
  const { saved } = useCaptureNotice();

  /** Resolves `true` when the screenshot was saved. */
  async function take(serial: string): Promise<boolean> {
    setBusy(true);
    try {
      saved("screenshot", await takeScreenshot(serial));
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { take, busy };
}
