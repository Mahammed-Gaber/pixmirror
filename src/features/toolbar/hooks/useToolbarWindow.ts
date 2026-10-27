import { useEffect } from "react";

import { useNotice } from "@/shared/notice";
import { enterToolbarMode, exitToolbarMode } from "../api";

/**
 * Keeps the native window in toolbar mode exactly while `active` is true.
 *
 * Enter/exit can overlap when mirroring dies quickly (e.g. Wi‑Fi drop). If enter
 * finishes after a stale exit, the window would stay slim while the connect UI
 * shows — so a cancelled enter always undoes itself with exit.
 */
export function useToolbarWindow(active: boolean) {
  const { notifyError } = useNotice();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (active) {
          await enterToolbarMode();
          if (cancelled) {
            await exitToolbarMode();
          }
        } else {
          await exitToolbarMode();
        }
      } catch (error) {
        if (!cancelled) notifyError(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, notifyError]);
}
