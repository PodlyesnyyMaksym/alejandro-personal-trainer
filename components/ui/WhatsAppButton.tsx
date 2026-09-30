import type { ComponentPropsWithoutRef } from "react";

import { TrackedWhatsAppLink } from "@/components/analytics/TrackedWhatsAppLink";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import type { WhatsAppSource } from "@/types/analytics";

type WhatsAppButtonProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  source: WhatsAppSource;
  variant?: "primary" | "secondary";
  message?: string;
};

export function WhatsAppButton({
  children,
  className,
  message,
  source,
  variant = "primary",
  ...props
}: WhatsAppButtonProps) {
  return (
    <TrackedWhatsAppLink
      className={cn(buttonStyles(variant), "gap-2", className)}
      data-source={source}
      href={getWhatsAppUrl(message)}
      rel="noopener noreferrer"
      source={source}
      target="_blank"
      {...props}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
        <path d="M12.04 2a9.84 9.84 0 0 0-8.53 14.74L2 22l5.38-1.42A9.94 9.94 0 0 0 12.04 22 9.96 9.96 0 0 0 22 12.05 9.96 9.96 0 0 0 12.04 2Zm0 18.32a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.2.84.85-3.12-.2-.32a8.17 8.17 0 0 1-1.25-4.35 8.28 8.28 0 1 1 8.28 8.27Zm4.54-6.2c-.25-.13-1.47-.73-1.7-.81-.23-.09-.4-.13-.57.12-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06a6.78 6.78 0 0 1-2-1.24 7.55 7.55 0 0 1-1.39-1.73c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.57-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.16 1.75 2.67 4.24 3.75.59.25 1.05.4 1.42.52.59.19 1.13.16 1.56.1.48-.07 1.47-.61 1.68-1.19.2-.58.2-1.08.14-1.18-.06-.1-.23-.17-.48-.29Z" />
      </svg>
      {children}
    </TrackedWhatsAppLink>
  );
}
