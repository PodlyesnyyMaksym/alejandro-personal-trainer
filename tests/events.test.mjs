import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Run from the repository root: node --test tests/events.test.mjs
// Dependencies are mocked; no environment files or database/network access.
function loadModule(path, globals = {}, imports = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    ...globals,
    exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return exports;
}

const UUID = "12345678-1234-4123-8123-123456789abc";
const event = () => ({
  clientEventId: UUID,
  sessionId: UUID,
  eventType: "page_view",
  source: "landing",
  landingPath: "/",
  utm: { source: null, medium: null, campaign: null, content: null, term: null },
});

function api({ env = {}, limited = false, failRate = false, failInsert = false } = {}) {
  const calls = { identities: [], events: [], logs: [] };
  const analytics = loadModule("types/analytics.ts");
  const { POST } = loadModule(
    "app/api/events/route.ts",
    {
      Uint8Array,
      TextDecoder,
      URL,
      process: { env },
      console: { warn: (...args) => calls.logs.push(args) },
    },
    {
      "node:net": { isIP },
      "next/server": { NextResponse: Response },
      "@/types/analytics": analytics,
      "@/lib/rate-limit": {
        async isRateLimited(identity) {
          calls.identities.push(identity);
          if (failRate) throw Error("secret rate exception");
          return limited;
        },
      },
      "@/lib/database": {
        async insertEvent(value) {
          calls.events.push(value);
          if (failInsert) throw Error("secret database exception");
        },
      },
    },
  );
  return { POST, calls };
}

function request(body = JSON.stringify(event()), headers = {}) {
  return new Request("https://example.test/api/events", {
    method: "POST",
    body,
    headers,
    duplex: "half",
  });
}

test("accepts closed event/source pairs and preserves idempotency identifier", async () => {
  const server = api();
  for (const source of [
    "landing",
    "hero_primary",
    "hero_secondary",
    "floating_whatsapp",
    "final_cta",
  ]) {
    const value = event();
    value.source = source;
    value.eventType = source === "landing" ? "page_view" : "whatsapp_click";
    const response = await server.POST(request(JSON.stringify(value)));
    assert.equal(response.status, 202);
    assert.equal(await response.text(), "");
    assert.equal(server.calls.events.at(-1).clientEventId, UUID);
  }
});

test("DNT is first, even with unavailable dependencies and unreadable body", async () => {
  const server = api({ failRate: true, failInsert: true });
  const response = await server.POST({
    headers: new Headers({ dnt: "1" }),
    get body() {
      assert.fail("DNT read body");
    },
  });
  assert.equal(response.status, 204);
  assert.deepEqual(server.calls, { identities: [], events: [], logs: [] });
});

const invalid = [
  ["extra key", (v) => (v.extra = true)],
  ["missing key", (v) => delete v.sessionId],
  ["UUID", (v) => (v.clientEventId = "bad")],
  ["event", (v) => (v.eventType = "purchase")],
  ["source", (v) => (v.source = "final_cta")],
  ["UTM key", (v) => (v.utm.extra = null)],
  ["UTM type", (v) => (v.utm.term = 42)],
  ["UTM length", (v) => (v.utm.term = "x".repeat(101))],
  ...["\0", "\n", "\t", "\x1f", "\x7f", "\x85", "\x9f"].map((control) => [
    `UTM control ${control.charCodeAt(0)}`,
    (v) => (v.utm.source = `a${control}b`),
  ]),
  ...[
    "relative",
    "//host",
    "/a//b",
    "/?query",
    "/#hash",
    "/a\\b",
    "/\0",
    "/\x85",
    "/%00",
    "/%0a",
    "/%2fhost",
    "/%5c",
    "/%zz",
    "/" + "x".repeat(200),
  ].map((path) => [`pathname ${JSON.stringify(path)}`, (v) => (v.landingPath = path)]),
];
for (const [name, mutate] of invalid) {
  test(`invalid input stays 400 with failed infrastructure: ${name}`, async () => {
    const server = api({ failRate: true, failInsert: true });
    const value = event();
    mutate(value);
    assert.equal((await server.POST(request(JSON.stringify(value)))).status, 400);
    assert.deepEqual(server.calls, { identities: [], events: [], logs: [] });
  });
}

test("malformed JSON, UTF-8 and stream failures return controlled 400", async () => {
  for (const body of ["{", "null", "[]", new Uint8Array([0xff])]) {
    const server = api();
    assert.equal((await server.POST(request(body))).status, 400);
    assert.equal(server.calls.identities.length, 0);
  }
  for (const failure of ["getReader", "read"]) {
    const server = api();
    const body = {
      getReader() {
        if (failure === "getReader") throw Error("secret");
        return {
          read: async () => {
            throw Error("secret");
          },
          cancel: async () => {
            throw Error("cancel secret");
          },
          releaseLock: () => {
            throw Error("release secret");
          },
        };
      },
    };
    assert.equal((await server.POST({ headers: new Headers(), body })).status, 400);
    assert.deepEqual(server.calls.logs, [["analytics: body_read"]]);
  }
});

test("4096-byte boundary is enforced independently of Content-Length", async () => {
  const base = JSON.stringify(event());
  for (const length of [4095, 4096, 4097]) {
    for (const contentLength of [undefined, "1", "999999", "invalid"]) {
      const server = api();
      const headers = contentLength === undefined ? {} : { "content-length": contentLength };
      const response = await server.POST(request(base + " ".repeat(length - base.length), headers));
      assert.equal(response.status, length > 4096 ? 413 : 202);
    }
  }
});

test("multi-byte chunked body cancels immediately at overflow and never drains", async () => {
  const server = api();
  let reads = 0;
  let cancels = 0;
  let released = false;
  const chunk = new TextEncoder().encode("é".repeat(1024));
  const response = await server.POST({
    headers: new Headers({ "content-length": "1" }),
    body: {
      getReader: () => ({
        read: async () => {
          reads++;
          return { done: false, value: chunk };
        },
        cancel: async () => {
          cancels++;
          throw Error("cancel secret");
        },
        releaseLock: () => {
          released = true;
        },
      }),
    },
  });
  assert.equal(response.status, 413);
  assert.equal(reads, 3);
  assert.equal(cancels, 1);
  assert.equal(released, true);
  assert.equal(server.calls.identities.length, 0);
});

test("UTF-8 characters split across chunks remain valid", async () => {
  const value = event();
  value.utm.source = "á";
  value.landingPath = "/entrenamiento/%C3%A1";
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  const server = api();
  assert.equal((await server.POST(request(stream, {}))).status, 202);
});

test("IP identity requires explicit trusted header and a single canonical IP", async () => {
  const cases = [
    [undefined, "x-real-ip", "192.0.2.1", "unknown"],
    ["other", "other", "192.0.2.1", "unknown"],
    ["x-real-ip", "x-forwarded-for", "192.0.2.1", "unknown"],
    ["x-real-ip", "x-real-ip", "192.0.2.1", "192.0.2.1"],
    ["x-forwarded-for", "x-forwarded-for", "2001:db8::1", "2001:db8::1"],
    ...[
      "",
      "bad",
      "192.000.2.1",
      "192.0.2.1:80",
      "192.0.2.1, 198.51.100.1",
      "2001:DB8::1",
      "2001:0db8::1",
      "[::1]",
      "fe80::1%eth0",
    ].map((ip) => ["x-forwarded-for", "x-forwarded-for", ip, "unknown"]),
  ];
  for (const [configured, header, value, expected] of cases) {
    const server = api({ env: { ANALYTICS_TRUSTED_IP_HEADER: configured } });
    assert.equal((await server.POST(request(undefined, { [header]: value }))).status, 202);
    assert.deepEqual(server.calls.identities, [expected]);
  }
  const server = api({ env: { ANALYTICS_TRUSTED_IP_HEADER: "x-real-ip" } });
  const headers = new Headers();
  headers.append("x-real-ip", "192.0.2.1");
  headers.append("x-real-ip", "192.0.2.2");
  await server.POST(request(undefined, headers));
  assert.deepEqual(server.calls.identities, ["unknown"]);
});

test("429 includes conservative Retry-After; infrastructure diagnostics contain only stages", async () => {
  const limited = api({ limited: true });
  const response = await limited.POST(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(limited.calls.events.length, 0);
  for (const stage of ["rate_limit", "insert"]) {
    const server = api({ failRate: stage === "rate_limit", failInsert: stage === "insert" });
    const response = await server.POST(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Analytics unavailable." });
    assert.deepEqual(server.calls.logs, [[`analytics: ${stage}`]]);
  }
});
