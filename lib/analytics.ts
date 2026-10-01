import type { AnalyticsEvent, EventSource, EventType, UtmData } from "@/types/analytics";

const SESSION_KEY = "landing_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const normalized = value
    ?.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .trim()
    .slice(0, 100);
  return normalized || null;
}

function captureUtm(): UtmData {
  const params = new URLSearchParams(window.location.search);

  return Object.fromEntries(
    UTM_KEYS.map((key) => [key, cleanUtmValue(params.get(`utm_${key}`))]),
  ) as UtmData;
}

function discardSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage can be unavailable; tracking must never affect navigation.
  }
  return null;
}

function readSession(now: number): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return discardSession();
    }

    const session = value as Partial<StoredSession>;
    if (
      typeof session.id !== "string" ||
      !UUID_PATTERN.test(session.id) ||
      typeof session.lastActivityAt !== "number" ||
      !Number.isFinite(session.lastActivityAt) ||
      session.lastActivityAt < 0 ||
      session.lastActivityAt > now ||
      now - session.lastActivityAt >= SESSION_TIMEOUT_MS ||
      !session.utm ||
      typeof session.utm !== "object" ||
      Array.isArray(session.utm) ||
      !UTM_KEYS.every((key) => {
        const value = session.utm?.[key];
        return (
          Object.hasOwn(session.utm!, key) &&
          (value === null || (typeof value === "string" && value.length <= 100))
        );
      }) ||
      Object.keys(session.utm).some((key) => !UTM_KEYS.some((utmKey) => utmKey === key))
    ) {
      return discardSession();
    }

    return {
      id: session.id,
      lastActivityAt: session.lastActivityAt,
      utm: Object.fromEntries(
        UTM_KEYS.map((key) => [key, cleanUtmValue(session.utm![key])]),
      ) as UtmData,
    };
  } catch {
    return discardSession();
  }
}

function getSession() {
  if (doNotTrackEnabled()) return null;

  const now = Date.now();
  const stored = readSession(now);
  const session: StoredSession = stored
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
  try {
    const event = createEvent(eventType, source);
    if (!event) return;

    const body = JSON.stringify(event);
    let sent = false;
    try {
      sent =
        navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" })) ??
        false;
    } catch {
      // A throwing beacon implementation still gets the keepalive fallback.
    }

    if (!sent) {
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // Analytics is best effort, including synchronous browser API failures.
  }
}

export function sendPageViewOnce() {
  if (pageViewSent) return;
  pageViewSent = true;
  sendAnalyticsEvent("page_view", "landing");
}
