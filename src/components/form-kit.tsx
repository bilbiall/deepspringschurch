import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:border-primary focus:outline-none";

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: (props: { id: string; className: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
        {required ? (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      {children({ id, className: control })}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Consent({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 rounded border-input accent-[oklch(0.46_0.072_214)]"
      />
      <label htmlFor={id} className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </label>
    </div>
  );
}

export function PrivacyNotice({ children }: { children?: ReactNode }) {
  return (
    <p className="rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children ?? (
        <>
          The information you share is used only to respond to you and is never sold or shared
          with third parties. See our{" "}
          <a href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </>
      )}
    </p>
  );
}
