"use client";

import type { ComponentPropsWithoutRef } from "react";

import { sendAnalyticsEvent } from "@/lib/analytics";
import type { WhatsAppSource } from "@/types/analytics";

type TrackedWhatsAppLinkProps = ComponentPropsWithoutRef<"a"> & {
  source: WhatsAppSource;
};

export function TrackedWhatsAppLink({
  onClick,
  onAuxClick,
  source,
  ...props
}: TrackedWhatsAppLinkProps) {
  function trackClick() {
    try {
      sendAnalyticsEvent("whatsapp_click", source);
    } catch {
      // Keep the native link functional even if tracking fails synchronously.
    }
  }

  return (
    <a
      onClick={(event) => {
        onClick?.(event);
        if (event.button === 0) trackClick();
      }}
      onAuxClick={(event) => {
        onAuxClick?.(event);
        if (event.button === 1) trackClick();
      }}
      {...props}
    />
  );
}
