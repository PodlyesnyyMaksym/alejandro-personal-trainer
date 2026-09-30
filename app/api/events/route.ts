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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isNullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === "string" && value.length <= maxLength);
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
    !value.landingPath.startsWith("/") ||
    value.landingPath.length > 200
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
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  if (request.headers.get("dnt") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    if (await isRateLimited(getClientIdentifier(request))) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Analytics unavailable." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const event = parseEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    await insertEvent(event);
    return new NextResponse(null, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Analytics unavailable." }, { status: 503 });
  }
}
