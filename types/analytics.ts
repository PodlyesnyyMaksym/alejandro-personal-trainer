export const EVENT_TYPES = ["page_view", "whatsapp_click"] as const;
export const WHATSAPP_SOURCES = [
  "hero_primary",
  "hero_secondary",
  "floating_whatsapp",
  "final_cta",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type WhatsAppSource = (typeof WHATSAPP_SOURCES)[number];
export type EventSource = "landing" | WhatsAppSource;

export type UtmData = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

export type AnalyticsEvent = {
  clientEventId: string;
  eventType: EventType;
  source: EventSource;
  sessionId: string;
  landingPath: string;
  utm: UtmData;
};
