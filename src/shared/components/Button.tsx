import type { ButtonHTMLAttributes } from "react";

import { cn } from "../utils/cn";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-white text-bg shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-[#f5f5f5] disabled:bg-line-strong disabled:text-faint disabled:shadow-none",
  ghost: "border border-line-strong text-fg hover:bg-raised hover:border-line disabled:text-faint",
  danger: "bg-rec/90 text-white hover:bg-rec disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  md: "h-8 px-3 gap-2 text-[13px]",
  lg: "h-10 px-5 gap-2.5 text-sm font-medium",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
};

export function Button({
  variant = "ghost",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "lg" ? 16 : 15} /> : null}
      {children}
    </button>
  );
}
