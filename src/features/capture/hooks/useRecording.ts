import { useState } from "react";

import { useNotice } from "@/shared/notice";
import { startRecording, stopRecording } from "../api";
import { useCaptureNotice } from "./useCaptureNotice";

type RecordingSource = {
  recording: boolean;
  refresh: () => Promise<void>;
};

/** Start/stop recording for the active mirror session (scrcpy restarts each time). */
export function useRecording({ recording, refresh }: RecordingSource) {
  const [busy, setBusy] = useState(false);
  const { notifyError } = useNotice();
  const { saved } = useCaptureNotice();

  /** Resolves `true` on success. */
  async function toggle(): Promise<boolean> {
    setBusy(true);
    try {
      if (recording) {
        saved("recording", await stopRecording());
      } else {
        await startRecording();
      }
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  return { toggle, busy };
}
