import "server-only";

import type { AnalyticsEvent } from "@/types/analytics";

export async function insertEvent(event: AnalyticsEvent) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase analytics is not configured.");
  }

  const response = await fetch(`${url}/rest/v1/events?on_conflict=client_event_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      client_event_id: event.clientEventId,
      event_type: event.eventType,
      source: event.source,
      session_id: event.sessionId,
      utm_source: event.utm.source,
      utm_medium: event.utm.medium,
      utm_campaign: event.utm.campaign,
      utm_content: event.utm.content,
      utm_term: event.utm.term,
      landing_path: event.landingPath,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase event insertion failed with status ${response.status}.`);
  }
}
