import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Run from the repository root: node --test tests/client-analytics.test.mjs
// All browser APIs are mocked: no network, environment files, or database access.
function loadModule(path, globals = {}, imports = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
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

const NOW = 1_800_000_000_000;
const UUID = "12345678-1234-4123-8123-123456789abc";
const utm = { source: null, medium: null, campaign: null, content: null, term: null };
const session = () => ({ id: UUID, lastActivityAt: NOW - 1, utm: { ...utm } });

function browser(raw = null, overrides = {}) {
  const calls = { ids: 0, reads: 0, removals: 0, writes: [], beacons: [], fetches: [] };
  const globals = {
    Date: { now: () => NOW },
    URLSearchParams,
    Blob,
    window: { location: { search: "", pathname: "/" } },
    navigator: {
      sendBeacon(url, body) {
        calls.beacons.push({ url, body });
        return true;
      },
    },
    localStorage: {
      getItem(key) {
        assert.equal(key, "landing_session");
        calls.reads++;
        return raw;
      },
      setItem(key, value) {
        assert.equal(key, "landing_session");
        raw = value;
        calls.writes.push(JSON.parse(value));
      },
      removeItem() {
        calls.removals++;
        raw = null;
      },
    },
    crypto: {
      randomUUID() {
        calls.ids++;
        return `aaaaaaaa-aaaa-4aaa-8aaa-${String(calls.ids).padStart(12, "0")}`;
      },
    },
    fetch(url, options) {
      calls.fetches.push({ url, ...options });
      return Promise.resolve();
    },
    ...overrides,
  };
  return { ...loadModule("lib/analytics.ts", globals), calls, globals };
}

test("valid session preserves attribution and updates activity", async () => {
  const stored = session();
  stored.utm.source = "original";
  const client = browser(JSON.stringify(stored));
  client.globals.window.location.search = "?utm_source=new";
  client.sendAnalyticsEvent("whatsapp_click", "hero_primary");
  assert.equal(client.calls.ids, 1);
  assert.equal(client.calls.writes[0].id, UUID);
  assert.equal(client.calls.writes[0].lastActivityAt, NOW);
  const event = JSON.parse(await client.calls.beacons[0].body.text());
  assert.equal(event.utm.source, "original");
  assert.equal(event.source, "hero_primary");
  assert.equal(event.sessionId, UUID);
});

const invalidSessions = [
  ["invalid JSON", "{"],
  ["null", "null"],
  ["array", "[]"],
  ["invalid UUID", JSON.stringify({ ...session(), id: "bad" })],
  ["invalid UUID variant", JSON.stringify({ ...session(), id: UUID.replace("8123", "7123") })],
  ["non-finite timestamp", JSON.stringify(session()).replace(String(NOW - 1), "1e400")],
  ["future timestamp", JSON.stringify({ ...session(), lastActivityAt: NOW + 1 })],
  ["negative timestamp", JSON.stringify({ ...session(), lastActivityAt: -1 })],
  ["string timestamp", JSON.stringify({ ...session(), lastActivityAt: String(NOW) })],
  ["expired at 30 minutes", JSON.stringify({ ...session(), lastActivityAt: NOW - 1_800_000 })],
  ["missing UTM field", JSON.stringify({ ...session(), utm: { source: null } })],
  ["UTM array", JSON.stringify({ ...session(), utm: [] })],
  ["UTM primitive", JSON.stringify({ ...session(), utm: "bad" })],
  ["UTM invalid value", JSON.stringify({ ...session(), utm: { ...utm, term: 3 } })],
  ["UTM too long", JSON.stringify({ ...session(), utm: { ...utm, term: "a".repeat(101) } })],
  ["UTM extra field", JSON.stringify({ ...session(), utm: { ...utm, extra: "bad" } })],
];

for (const [name, raw] of invalidSessions) {
  test(`discard and regenerate: ${name}`, () => {
    const client = browser(raw);
    client.globals.window.location.search = "?utm_source=fresh";
    client.sendAnalyticsEvent("page_view", "landing");
    assert.equal(client.calls.removals, 1);
    assert.equal(client.calls.ids, 2);
    assert.notEqual(client.calls.writes[0].id, UUID);
    assert.equal(client.calls.writes[0].utm.source, "fresh");
  });
}

test("session remains active just before expiration", () => {
  const client = browser(JSON.stringify({ ...session(), lastActivityAt: NOW - 1_799_999 }));
  client.sendAnalyticsEvent("page_view", "landing");
  assert.equal(client.calls.writes[0].id, UUID);
});

test("normalize URL and persisted UTMs, including NUL and C0/C1 controls", () => {
  const fresh = browser();
  fresh.globals.window.location.search =
    "?utm_source=%00+foo%0Abar%7F%C2%85+&utm_term=" + "a".repeat(101);
  fresh.sendAnalyticsEvent("page_view", "landing");
  assert.equal(fresh.calls.writes[0].utm.source, "foo bar");
  assert.equal(fresh.calls.writes[0].utm.term.length, 100);
  const stored = browser(
    JSON.stringify({ ...session(), utm: { ...utm, source: "\0 foo\tbar\x7f\x85 " } }),
  );
  stored.sendAnalyticsEvent("page_view", "landing");
  assert.equal(stored.calls.writes[0].utm.source, "foo bar");
});

for (const location of ["navigator", "window"]) {
  test(`DNT via ${location} precedes identifiers and storage`, () => {
    const client = browser();
    client.globals[location].doNotTrack = "1";
    client.sendAnalyticsEvent("whatsapp_click", "final_cta");
    assert.equal(client.calls.ids, 0);
    assert.equal(client.calls.reads, 0);
    assert.equal(client.calls.writes.length, 0);
    assert.equal(client.calls.beacons.length, 0);
    assert.equal(client.calls.fetches.length, 0);
  });
}

for (const mode of ["false", "missing", "throws", "getter throws"]) {
  test(`fetch fallback when beacon ${mode}`, () => {
    const client = browser();
    if (mode === "missing") delete client.globals.navigator.sendBeacon;
    else if (mode === "getter throws") {
      Object.defineProperty(client.globals.navigator, "sendBeacon", {
        get() {
          throw Error("beacon");
        },
      });
    } else
      client.globals.navigator.sendBeacon = () => {
        if (mode === "throws") throw Error("beacon");
        return false;
      };
    assert.doesNotThrow(() => client.sendAnalyticsEvent("page_view", "landing"));
    assert.equal(client.calls.fetches.length, 1);
    assert.equal(client.calls.fetches[0].keepalive, true);
    assert.equal(client.calls.fetches[0].url, "/api/events");
  });
}

test("synchronous crypto failures on either identifier are isolated", () => {
  for (const failAt of [1, 2]) {
    const client = browser();
    let count = 0;
    client.globals.crypto.randomUUID = () => {
      if (++count === failAt) throw Error("crypto");
      return UUID;
    };
    assert.doesNotThrow(() => client.sendAnalyticsEvent("page_view", "landing"));
    assert.equal(client.calls.beacons.length, 0);
  }
});

test("storage access/write/removal and synchronous/asynchronous fetch failures are isolated", async () => {
  for (const method of ["getItem", "setItem", "removeItem"]) {
    const client = browser("{");
    client.globals.localStorage[method] = () => {
      throw Error("storage");
    };
    assert.doesNotThrow(() => client.sendAnalyticsEvent("page_view", "landing"));
  }
  for (const asyncFailure of [false, true]) {
    const client = browser();
    client.globals.navigator.sendBeacon = () => false;
    client.globals.fetch = () => {
      if (asyncFailure) return Promise.reject(Error("fetch"));
      throw Error("fetch");
    };
    assert.doesNotThrow(() => client.sendAnalyticsEvent("page_view", "landing"));
    await new Promise((resolve) => setImmediate(resolve));
  }
});

test("page view is emitted once per module/document", () => {
  const client = browser();
  client.sendPageViewOnce();
  client.sendPageViewOnce();
  assert.equal(client.calls.beacons.length, 1);
  assert.equal(client.calls.fetches.length, 0);
});

const jsx = (type, props) => ({ type, props });

test("link tracks primary click and middle auxclick only; retains href and caller handlers", () => {
  const calls = [];
  let callerClicks = 0;
  let callerAuxClicks = 0;
  const { TrackedWhatsAppLink } = loadModule(
    "components/analytics/TrackedWhatsAppLink.tsx",
    {},
    {
      "react/jsx-runtime": { jsx },
      "@/lib/analytics": { sendAnalyticsEvent: (...args) => calls.push(args) },
    },
  );
  const link = TrackedWhatsAppLink({
    href: "https://wa.me/",
    source: "hero_secondary",
    target: "_blank",
    onClick: () => callerClicks++,
    onAuxClick: () => callerAuxClicks++,
  });
  for (const button of [0, 1, 2]) {
    const event = {
      button,
      preventDefault() {
        assert.fail("Navigation was blocked");
      },
    };
    link.props.onClick(event);
    link.props.onAuxClick(event);
  }
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], ["whatsapp_click", "hero_secondary"]);
  assert.equal(callerClicks, 3);
  assert.equal(callerAuxClicks, 3);
  assert.equal(link.type, "a");
  assert.equal(link.props.href, "https://wa.me/");
  assert.equal(link.props.target, "_blank");
});

test("link isolates thrown tracking errors for both supported buttons", () => {
  const { TrackedWhatsAppLink } = loadModule(
    "components/analytics/TrackedWhatsAppLink.tsx",
    {},
    {
      "react/jsx-runtime": { jsx },
      "@/lib/analytics": {
        sendAnalyticsEvent() {
          throw Error("tracking");
        },
      },
    },
  );
  const { props } = TrackedWhatsAppLink({ href: "https://wa.me/", source: "final_cta" });
  assert.doesNotThrow(() => props.onClick({ button: 0 }));
  assert.doesNotThrow(() => props.onAuxClick({ button: 1 }));
});

test("footer is a sibling of main", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const imports = { "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" } };
  for (const [, name, path] of source.matchAll(/import \{ (\w+) \} from "([^"]+)"/g)) {
    imports[path] = { [name]: name };
  }
  const page = loadModule("app/page.tsx", { process: { env: {} } }, imports).default();
  const children = page.props.children;
  assert.equal(children[0].type, "main");
  assert.equal(children[1].type, "Footer");
  assert.ok(children[0].props.children.every((child) => !child || child.type !== "Footer"));
});
