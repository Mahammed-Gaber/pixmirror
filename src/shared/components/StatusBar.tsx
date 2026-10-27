import type { ReactNode } from "react";

/** Thin bottom bar, like the status bar of a native desktop tool. */
export function StatusBar({ start, end }: { start: ReactNode; end?: ReactNode }) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-line bg-surface px-3 text-xs text-muted">
      <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>
      {end ? <div className="flex shrink-0 items-center gap-3">{end}</div> : null}
    </footer>
  );
}
