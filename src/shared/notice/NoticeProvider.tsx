import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { te } from "../i18n";
import { NoticeContext, type Notice, type NoticeInput } from "./context";

const DURATION_MS = { info: 5000, success: 7000, error: 12000 } as const;

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const nextId = useRef(1);

  const notify = useCallback((input: NoticeInput) => {
    setNotice({ ...input, id: nextId.current++ });
  }, []);

  const notifyError = useCallback(
    (error: unknown) => notify({ tone: "error", text: te(error) }),
    [notify],
  );

  const dismiss = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(
      () => setNotice((current) => (current?.id === notice.id ? null : current)),
      DURATION_MS[notice.tone],
    );
    return () => window.clearTimeout(id);
  }, [notice]);

  const value = useMemo(
    () => ({ notice, notify, notifyError, dismiss }),
    [notice, notify, notifyError, dismiss],
  );

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}
