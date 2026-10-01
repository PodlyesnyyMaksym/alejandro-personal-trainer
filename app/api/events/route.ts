import { isIP } from "node:net";
import { NextResponse } from "next/server";

import { insertEvent } from "@/lib/database";
import { isRateLimited } from "@/lib/rate-limit";
import {
  EVENT_TYPES,
  WHATSAPP_SOURCES,
  type AnalyticsEvent,
  type EventSource,
  type EventType,
  type UtmData,
} from "@/types/analytics";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 4_096;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOP_LEVEL_KEYS = ["clientEventId", "eventType", "source", "sessionId", "landingPath", "utm"];
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"];
// Reject C0/C1 controls rather than passing values PostgreSQL cannot store.
const CONTROL_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

function isPathname(value: string) {
  if (!value.startsWith("/") || value.length > 200 || /[?#\\]/.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    return !CONTROL_PATTERN.test(decoded) && !decoded.includes("//") && !decoded.includes("\\");
  } catch {
    return false;
  }
}

// Keep the retained body bounded in bytes, including chunked requests and UTF-8.
// Content-Length is deliberately not needed to enforce this limit.
async function readBody(
  request: Request,
): Promise<{ text: string; status?: never } | { status: 400 | 413; text?: never }> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const buffer = new Uint8Array(MAX_BODY_SIZE);
  let size = 0;
  const cancel = () => {
    try {
      void reader?.cancel().catch(() => {});
    } catch {
      // Cancellation failures must not change the controlled response.
    }
  };
  try {
    if (!request.body) return { status: 400 };
    reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > MAX_BODY_SIZE - size) {
        cancel();
        return { status: 413 };
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, size)) };
  } catch {
    cancel();
    console.warn("analytics: body_read");
    return { status: 400 };
  } finally {
    try {
      reader?.releaseLock();
    } catch {
      // A failed stream must still produce the controlled response above.
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isNullableText(value: unknown, maxLength: number): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && value.length <= maxLength && !CONTROL_PATTERN.test(value))
  );
}

function parseEvent(value: unknown): AnalyticsEvent | null {
  if (!isRecord(value) || !hasExactKeys(value, TOP_LEVEL_KEYS) || !isRecord(value.utm)) {
    return null;
  }

  if (!hasExactKeys(value.utm, UTM_KEYS)) return null;

  const eventType = value.eventType as EventType;
  const source = value.source as EventSource;
  const validEventType = typeof eventType === "string" && EVENT_TYPES.includes(eventType);
  const validSource =
    (eventType === "page_view" && source === "landing") ||
    (eventType === "whatsapp_click" &&
      WHATSAPP_SOURCES.some((allowedSource) => allowedSource === source));

  if (
    !validEventType ||
    !validSource ||
    typeof value.clientEventId !== "string" ||
    !UUID_PATTERN.test(value.clientEventId) ||
    typeof value.sessionId !== "string" ||
    !UUID_PATTERN.test(value.sessionId) ||
    typeof value.landingPath !== "string" ||
    !isPathname(value.landingPath)
  ) {
    return null;
  }

  const utm = value.utm;
  if (!UTM_KEYS.every((key) => isNullableText(utm[key], 100))) return null;

  return {
    clientEventId: value.clientEventId,
    eventType,
    source,
    sessionId: value.sessionId,
    landingPath: value.landingPath,
    utm: utm as UtmData,
  };
}

function getClientIdentifier(request: Request) {
  // Server-only opt-in: configure only when an upstream proxy strips client
  // values and overwrites this header with one verified IP. No runtime/provider
  // guarantees are assumed; forwarding chains are never interpreted here.
  const header = process.env.ANALYTICS_TRUSTED_IP_HEADER;
  if (header !== "x-forwarded-for" && header !== "x-real-ip") return "unknown";
  const value = request.headers.get(header);
  if (!value || !isIP(value)) return "unknown";
  if (isIP(value) === 6) {
    try {
      const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
      if (value !== canonical) return "unknown";
    } catch {
      // Scoped IPv6 and other non-URL IP forms cannot become bucket identities.
      return "unknown";
    }
  }
  return value;
}

export async function POST(request: Request) {
  if (request.headers.get("dnt") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  const body = await readBody(request);
  if (body.status) {
    return NextResponse.json({ error: "Invalid payload." }, { status: body.status });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const event = parseEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    if (await isRateLimited(getClientIdentifier(request))) {
      // The limiter uses fixed minute buckets; 60 seconds is conservative even
      // when this request arrives near the end of the current window.
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  } catch {
    console.warn("analytics: rate_limit");
    return NextResponse.json({ error: "Analytics unavailable." }, { status: 503 });
  }

  try {
    await insertEvent(event);
    return new NextResponse(null, { status: 202 });
  } catch {
    console.warn("analytics: insert");
    return NextResponse.json({ error: "Analytics unavailable." }, { status: 503 });
  }
}
