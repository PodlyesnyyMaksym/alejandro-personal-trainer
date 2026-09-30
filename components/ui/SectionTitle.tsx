import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionTitleProps = {
  title: ReactNode;
  eyebrow?: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  size?: "hero" | "section";
  className?: string;
};

const sizeClasses = {
  hero: "text-[clamp(3rem,8vw,6.75rem)] leading-[0.92]",
  section: "text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.95]",
};

export function SectionTitle({
  title,
  eyebrow,
  description,
  align = "left",
  as: Heading = "h2",
  size = "section",
  className,
}: SectionTitleProps) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      ) : null}
      <Heading
        className={cn(
          "max-w-4xl font-display font-semibold tracking-[-0.035em] text-balance uppercase",
          sizeClasses[size],
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
