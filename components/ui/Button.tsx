import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-background hover:border-accent-hover hover:bg-accent-hover",
  secondary:
    "border-border bg-transparent text-foreground hover:border-accent hover:text-accent-hover",
};

const baseClasses =
  "inline-flex min-h-12 items-center justify-center rounded-sm border px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function buttonStyles(variant: ButtonVariant = "primary", className?: string) {
  return cn(baseClasses, variantClasses[variant], className);
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={buttonStyles(variant, className)} {...props} />;
}
