import { cn } from "@/lib/utils";

type StatProps = {
  value: string;
  label: string;
  className?: string;
};

export function Stat({ value, label, className }: StatProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col justify-end border-t border-border bg-surface/45 p-5 sm:min-h-48 sm:p-6",
        className,
      )}
    >
      <dt className="order-2 mt-2 max-w-40 text-sm leading-6 text-muted">{label}</dt>
      <dd className="order-1 font-display text-5xl leading-none font-semibold tracking-[-0.04em] text-accent sm:text-6xl">
        {value}
      </dd>
    </div>
  );
}
