import type { ButtonHTMLAttributes } from "react";

import { cn } from "../utils/cn";
import { Icon, type IconName } from "./Icon";

type Tone = "default" | "danger" | "rec" | "ok";
type Size = "sm" | "lg";

const TONES: Record<Tone, string> = {
  default: "text-muted hover:text-fg hover:bg-raised",
  danger: "text-muted hover:text-white hover:bg-rec/85",
  rec: "text-rec bg-rec/10 hover:bg-rec/20",
  ok: "text-ok bg-ok/10",
};

const SIZES: Record<Size, { box: string; icon: number }> = {
  sm: { box: "size-7", icon: 16 },
  lg: { box: "size-10", icon: 19 },
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  label: string;
  tone?: Tone;
  size?: Size;
};

/** Square icon-only button; `label` doubles as tooltip and accessible name. */
export function IconButton({
  icon,
  label,
  tone = "default",
  size = "sm",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        SIZES[size].box,
        TONES[tone],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={SIZES[size].icon} />
    </button>
  );
}
