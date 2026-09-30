import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = ComponentPropsWithoutRef<"span">;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent",
        className,
      )}
      {...props}
    />
  );
}
