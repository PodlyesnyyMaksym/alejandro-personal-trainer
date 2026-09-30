import type { AnalyticsEvent, EventSource, EventType, UtmData } from "@/types/analytics";

const SESSION_KEY = "landing_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;

type StoredSession = {
  id: string;
  lastActivityAt: number;
  utm: UtmData;
};

let pageViewSent = false;

function doNotTrackEnabled() {
  const browserWindow = window as Window & { doNotTrack?: string };
  return navigator.doNotTrack === "1" || browserWindow.doNotTrack === "1";
}

function cleanUtmValue(value: string | null) {
  const normalized = value?.trim().slice(0, 100);
  return normalized || null;
}

function captureUtm(): UtmData {
  const params = new URLSearchParams(window.location.search);

  return Object.fromEntries(
    UTM_KEYS.map((key) => [key, cleanUtmValue(params.get(`utm_${key}`))]),
  ) as UtmData;
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;

    const session = value as Partial<StoredSession>;
    if (
      typeof session.id !== "string" ||
      typeof session.lastActivityAt !== "number" ||
      !session.utm
    ) {
      return null;
    }

    return session as StoredSession;
  } catch {
    return null;
  }
}

function getSession() {
  if (doNotTrackEnabled()) return null;

  const now = Date.now();
  const stored = readSession();
  const isActive = stored && now - stored.lastActivityAt < SESSION_TIMEOUT_MS;
  const session: StoredSession = isActive
    ? { ...stored, lastActivityAt: now }
    : { id: crypto.randomUUID(), lastActivityAt: now, utm: captureUtm() };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    return null;
  }

  return session;
}

function createEvent(eventType: EventType, source: EventSource): AnalyticsEvent | null {
  const session = getSession();
  if (!session) return null;

  return {
    clientEventId: crypto.randomUUID(),
    eventType,
    source,
    sessionId: session.id,
    landingPath: window.location.pathname.slice(0, 200),
    utm: session.utm,
  };
}

export function sendAnalyticsEvent(eventType: EventType, source: EventSource) {
  const event = createEvent(eventType, source);
  if (!event) return;

  const body = JSON.stringify(event);
  const sent = navigator.sendBeacon?.(
    "/api/events",
    new Blob([body], { type: "application/json" }),
  );

  if (!sent) {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}

export function sendPageViewOnce() {
  if (pageViewSent) return;
  pageViewSent = true;
  sendAnalyticsEvent("page_view", "landing");
}
