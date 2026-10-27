import type { ReactNode } from "react";

import { cn } from "../utils/cn";

/** Left-to-right monospace text (serials, IPs, paths) inside the RTL layout. */
export function Mono({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span dir="ltr" className={cn("font-mono", className)} title={title}>
      {children}
    </span>
  );
}
