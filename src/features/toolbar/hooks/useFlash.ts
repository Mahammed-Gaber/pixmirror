import { useCallback, useEffect, useState } from "react";

type Flash = { id: string; ok: boolean };

/** Brief success/failure tint on a toolbar button (there is no room for text). */
export function useFlash(duration = 1200) {
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), duration);
    return () => window.clearTimeout(id);
  }, [flash, duration]);

  const show = useCallback((id: string, ok: boolean) => setFlash({ id, ok }), []);

  const toneFor = (id: string) => (flash?.id === id ? (flash.ok ? "ok" : "rec") : undefined);

  return { show, toneFor };
}
