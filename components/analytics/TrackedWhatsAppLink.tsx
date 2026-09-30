"use client";

import type { ComponentPropsWithoutRef } from "react";

import { sendAnalyticsEvent } from "@/lib/analytics";
import type { WhatsAppSource } from "@/types/analytics";

type TrackedWhatsAppLinkProps = ComponentPropsWithoutRef<"a"> & {
  source: WhatsAppSource;
};

export function TrackedWhatsAppLink({ onClick, source, ...props }: TrackedWhatsAppLinkProps) {
  return (
    <a
      onClick={(event) => {
        onClick?.(event);
        sendAnalyticsEvent("whatsapp_click", source);
      }}
      {...props}
    />
  );
}
