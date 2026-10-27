import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { useInterval } from "@/shared/hooks/useInterval";
import { useNotice } from "@/shared/notice";
import { getMirrorStatus, startMirroring, stopMirroring } from "../api";
import { IDLE_STATUS } from "../constants";
import type { MirrorOptions } from "../types";

/** Fast enough to notice the user closing the scrcpy window. */
const POLL_MS = 1000;

export function useMirrorSession() {
  const [status, setStatus] = useState(IDLE_STATUS);
  const [pending, setPending] = useState<"start" | "stop" | null>(null);
  const { notify, notifyError } = useNotice();
  const { t } = useTranslation();
  const intentionalStop = useRef(false);
  const wasActive = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getMirrorStatus());
    } catch {
      /* transient; next poll retries */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useInterval(() => void refresh(), POLL_MS);

  useEffect(() => {
    const active = status.active;
    if (wasActive.current && !active && !intentionalStop.current) {
      notify({ tone: "info", text: t("mirror.endedUnexpectedly") });
    }
    if (!active) {
      intentionalStop.current = false;
    }
    wasActive.current = active;
  }, [status.active, notify, t]);

  async function start(options: MirrorOptions) {
    setPending("start");
    try {
      await startMirroring(options);
      await refresh();
    } catch (error) {
      notifyError(error);
    } finally {
      setPending(null);
    }
  }

  /** Returns the saved recording path when stopping mid-recording. */
  async function stop(): Promise<string | null> {
    intentionalStop.current = true;
    setPending("stop");
    try {
      return await stopMirroring();
    } catch (error) {
      notifyError(error);
      return null;
    } finally {
      await refresh();
      try {
        const still = await getMirrorStatus();
        if (still.active) {
          intentionalStop.current = false;
        }
      } catch {
        intentionalStop.current = false;
      }
      setPending(null);
    }
  }

  return { status, pending, start, stop, refresh };
}

export type MirrorSession = ReturnType<typeof useMirrorSession>;
