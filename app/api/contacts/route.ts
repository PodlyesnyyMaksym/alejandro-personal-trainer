import { isIP } from "node:net";
import { NextResponse } from "next/server";

import { insertContact, parseContactSubmission } from "@/lib/contacts";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 4_096;

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
    console.warn("contacts: body_read");
    return { status: 400 };
  } finally {
    try {
      reader?.releaseLock();
    } catch {
      // Stream failures still produce the controlled response above.
    }
  }
}

function getClientIdentifier(request: Request) {
  // Match /api/events: opt in only when the upstream proxy overwrites this
  // header with a single verified IP. Never interpret forwarding chains.
  const header = process.env.ANALYTICS_TRUSTED_IP_HEADER;
  if (header !== "x-forwarded-for" && header !== "x-real-ip") return "unknown";
  const value = request.headers.get(header);
  if (!value || !isIP(value)) return "unknown";
  if (isIP(value) === 6) {
    try {
      const canonical = new URL(`http://[${value}]/`).hostname.slice(1, -1);
      if (value !== canonical) return "unknown";
    } catch {
      return "unknown";
    }
  }
  return value;
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.CONTACT_FORM_ALLOWED_ORIGINS;
  if (!configured) return origin === new URL(request.url).origin;
  // Deno's reverse proxy may present an internal request URL to Next.js.
  // Trust only the operator's explicit public origins, never forwarding headers.
  return configured.split(",").some((value) => {
    const allowed = value.trim();
    try {
      const url = new URL(allowed);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.origin === allowed &&
        origin === allowed
      );
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  if (process.env.CONTACT_FORM_ENABLED !== "true") {
    return NextResponse.json({ error: "Contact form unavailable." }, { status: 503 });
  }

  // An explicit allowlist handles trusted public origins behind a reverse proxy.
  // Without one, require the direct request origin (local development).
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
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
  const contact = parseContactSubmission(parsed);
  if (!contact) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // An explicitly requested contact is independent of analytics and DNT.
  try {
    if (await isRateLimited(`contacts:${getClientIdentifier(request)}`)) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  } catch {
    console.warn("contacts: rate_limit");
    return NextResponse.json({ error: "Contact form unavailable." }, { status: 503 });
  }

  try {
    await insertContact(contact);
    return new NextResponse(null, { status: 202 });
  } catch {
    console.warn("contacts: insert");
    return NextResponse.json({ error: "Contact form unavailable." }, { status: 503 });
  }
}
