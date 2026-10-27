import { cn } from "../utils/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-start disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cn(
          "mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "justify-end bg-ok" : "justify-start bg-line-strong",
        )}
      >
        <span className="size-3.5 rounded-full bg-fg" />
      </span>
      <span className="grid gap-0.5">
        <span className="text-[13px] text-fg">{label}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}
