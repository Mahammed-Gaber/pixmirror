import { cn } from "../utils/cn";

type Tone = "ok" | "warn" | "rec" | "idle";

const TONES: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  rec: "bg-rec",
  idle: "bg-faint",
};

export function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-full", TONES[tone], pulse && "animate-pulse")}
    />
  );
}
