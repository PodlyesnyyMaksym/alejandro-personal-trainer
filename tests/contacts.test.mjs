import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// All infrastructure is mocked; these tests never load env files or connect.
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
const submission = () => ({
  clientSubmissionId: UUID,
  name: "  María Pérez  ",
  phone: "+12 (345) 678-9012",
  consent: true,
  website: "",
});

function api({ env = {}, limited = false, failRate = false, failInsert = false } = {}) {
  const calls = { identities: [], queries: [], logs: [] };
  const contacts = loadModule(
    "lib/contacts.ts",
    {},
    {
      "server-only": {},
      "@/lib/database": {
        async queryDatabase(sql, params) {
          calls.queries.push({ sql, params: Array.from(params) });
          if (failInsert) throw Error("secret name phone database exception");
        },
      },
    },
  );
  const route = loadModule(
    "app/api/contacts/route.ts",
    {
      Uint8Array,
      TextDecoder,
      URL,
      process: { env: { CONTACT_FORM_ENABLED: "true", ...env } },
      console: { warn: (...args) => calls.logs.push(args) },
    },
    {
      "node:net": { isIP },
      "next/server": { NextResponse: Response },
      "@/lib/contacts": contacts,
      "@/lib/rate-limit": {
        async isRateLimited(identity) {
          calls.identities.push(identity);
          if (failRate) throw Error("secret name phone rate exception");
          return limited;
        },
      },
    },
  );
  return { ...route, contacts, calls };
}

function request(body = JSON.stringify(submission()), headers = {}) {
  return new Request("https://example.test/api/contacts", {
    method: "POST",
    body,
    headers: { origin: "https://example.test", ...headers },
    duplex: "half",
  });
}

test("normalizes name and phone without assuming country, including under DNT", async () => {
  for (const [phone, expected] of [
    ["+12 (345) 678-9012", "+123456789012"],
    ["  +12 (345) 678-9012  ", "+123456789012"],
    ["(012) 345-6789", "0123456789"],
    ["123456789012345", "123456789012345"],
  ]) {
    const server = api();
    const value = { ...submission(), phone };
    const response = await server.POST(request(JSON.stringify(value), { dnt: "1" }));
    assert.equal(response.status, 202);
    assert.equal(await response.text(), "");
    assert.deepEqual(server.calls.identities, ["contacts:unknown"]);
    assert.deepEqual(server.calls.queries[0].params, [UUID, "María Pérez", expected, "contact-v1"]);
    assert.deepEqual(server.calls.logs, []);
  }
});

test("consent version is fixed and notice matches the approved UI copy", () => {
  const { contacts } = api();
  assert.equal(contacts.CONTACT_CONSENT_NOTICE_VERSION, "contact-v1");
  assert.equal(
    contacts.CONTACT_CONSENT_NOTICE,
    "Usaremos tu nombre y teléfono para responder tu consulta sobre entrenamiento. El responsable es el dueño de este proyecto. Conservaremos los datos sin plazo fijo, hasta que el responsable decida eliminarlos o solicites su eliminación por WhatsApp. No te suscribimos a publicidad.",
  );
});

test("explicit public origins work behind internal proxy URLs without trusting forwarding headers", async () => {
  const server = api({
    env: { CONTACT_FORM_ALLOWED_ORIGINS: "https://landing.test, https://preview.test" },
  });
  for (const origin of ["https://landing.test", "https://preview.test"]) {
    const response = await server.POST(
      new Request("http://internal:3000/api/contacts", {
        method: "POST",
        headers: { origin },
        body: JSON.stringify(submission()),
      }),
    );
    assert.equal(response.status, 202);
  }
  for (const origin of ["http://internal:3000", "https://foreign.test", "null"]) {
    assert.equal(
      (await server.POST(request(undefined, { origin, "x-forwarded-host": "landing.test" })))
        .status,
      403,
    );
  }
});

test("invalid configured origins do not fall back to the direct request URL", async () => {
  for (const allowed of ["*", "https://example.test/path", "not-a-url", "https://example.test/"]) {
    const server = api({ env: { CONTACT_FORM_ALLOWED_ORIGINS: allowed } });
    assert.equal((await server.POST(request())).status, 403);
    assert.equal(server.calls.queries.length, 0);
  }
});

test("only exact server flag true enables API, before reading body or dependencies", async () => {
  for (const flag of [undefined, "false", "TRUE", "1", " true", ""]) {
    const server = api({ env: { CONTACT_FORM_ENABLED: flag }, failRate: true, failInsert: true });
    const response = await server.POST({
      get body() {
        assert.fail("Disabled API read body");
      },
    });
    assert.equal(response.status, 503);
    assert.deepEqual(server.calls, { identities: [], queries: [], logs: [] });
  }
});

test("requires exact request URL origin, rejects missing/null/spoofed origin without CORS", async () => {
  for (const origin of [
    null,
    "null",
    "https://attacker.test",
    "http://example.test",
    "https://example.test:444",
    "https://example.test/",
    "https://example.test.attacker.test",
    "https://example.test, https://attacker.test",
  ]) {
    const server = api();
    const headers = new Headers({ "x-forwarded-host": "attacker.test" });
    if (origin !== null) headers.set("origin", origin);
    const response = await server.POST({
      url: "https://example.test/api/contacts",
      headers,
      get body() {
        assert.fail("Rejected origin read body");
      },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.has("access-control-allow-origin"), false);
    assert.deepEqual(server.calls, { identities: [], queries: [], logs: [] });
  }
  const server = api();
  assert.equal(
    (await server.POST(request(undefined, { "x-forwarded-host": "attacker.test" }))).status,
    202,
  );
  assert.equal(Object.hasOwn(server, "GET"), false);
  assert.equal(Object.hasOwn(server, "OPTIONS"), false);
});

const invalid = [
  ["extra analytics field", (v) => (v.sessionId = UUID)],
  ["extra consent version", (v) => (v.consentNoticeVersion = "custom")],
  ["missing key", (v) => delete v.website],
  ["UUID", (v) => (v.clientSubmissionId = "bad")],
  ["UUID variant", (v) => (v.clientSubmissionId = "12345678-1234-4123-0123-123456789abc")],
  ["name type", (v) => (v.name = 123)],
  ["empty name", (v) => (v.name = "   ")],
  ["long name", (v) => (v.name = "x".repeat(101))],
  ["phone type", (v) => (v.phone = 1234567890)],
  ["consent false", (v) => (v.consent = false)],
  ["consent string", (v) => (v.consent = "true")],
  ["honeypot", (v) => (v.website = "https://spam.test")],
  ["honeypot whitespace", (v) => (v.website = " ")],
  ["honeypot type", (v) => (v.website = null)],
  ...["\0", "\n", "\t", "\x1f", "\x7f", "\x85", "\x9f"].map((control) => [
    `name control ${control.charCodeAt(0)}`,
    (v) => (v.name = `${control}María`),
  ]),
  ...[
    "123456789",
    "1234567890123456",
    "++1234567890",
    "12+34567890",
    "1234567890x",
    "123.456.7890",
    "1234567890\n",
    "１２３４５６７８９０",
    "1234567890 ext 12",
  ].map((phone) => [`phone ${JSON.stringify(phone)}`, (v) => (v.phone = phone)]),
];
for (const [name, mutate] of invalid) {
  test(`generic 400 without database or rate-limit access: ${name}`, async () => {
    const server = api({ failRate: true, failInsert: true });
    const value = submission();
    mutate(value);
    const response = await server.POST(request(JSON.stringify(value)));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid payload." });
    assert.deepEqual(server.calls, { identities: [], queries: [], logs: [] });
  });
}

test("name boundary is applied after trim and UUID supports modern versions", async () => {
  for (const name of [" A ", " x".trim() + "x".repeat(99), "😀".repeat(100)]) {
    const server = api();
    const value = { ...submission(), name, clientSubmissionId: UUID.replace("-4123-", "-7123-") };
    assert.equal((await server.POST(request(JSON.stringify(value)))).status, 202);
  }
});

test("malformed JSON and invalid UTF-8 return 400 before infrastructure", async () => {
  for (const body of ["{", "null", "[]", "true", new Uint8Array([0xff])]) {
    const server = api();
    assert.equal((await server.POST(request(body))).status, 400);
    assert.deepEqual(server.calls, {
      identities: [],
      queries: [],
      logs: body instanceof Uint8Array ? [["contacts: body_read"]] : [],
    });
  }
});

test("enforces 4096 bytes regardless of Content-Length, including chunked UTF-8", async () => {
  const base = JSON.stringify(submission());
  const bytes = new TextEncoder().encode(base).byteLength;
  for (const size of [4095, 4096, 4097]) {
    for (const length of [undefined, "1", "999999", "invalid"]) {
      const server = api();
      const headers = length === undefined ? {} : { "content-length": length };
      const response = await server.POST(request(base + " ".repeat(size - bytes), headers));
      assert.equal(response.status, size > 4096 ? 413 : 202);
      if (size > 4096) assert.equal(server.calls.identities.length, 0);
    }
  }
  const server = api();
  let reads = 0;
  let cancels = 0;
  let released = false;
  const response = await server.POST({
    url: "https://example.test/api/contacts",
    headers: new Headers({ origin: "https://example.test" }),
    body: {
      getReader: () => ({
        read: async () => {
          reads++;
          return { done: false, value: new TextEncoder().encode("é".repeat(1024)) };
        },
        cancel: async () => {
          cancels++;
          throw Error("secret cancellation");
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

  const stream = new ReadableStream({
    start(controller) {
      for (const byte of new TextEncoder().encode(base)) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  assert.equal((await api().POST(request(stream))).status, 202);
});

test("stream errors are sanitized and return 400", async () => {
  for (const failure of ["getReader", "read"]) {
    const server = api();
    const response = await server.POST({
      url: "https://example.test/api/contacts",
      headers: new Headers({ origin: "https://example.test" }),
      body: {
        getReader() {
          if (failure === "getReader") throw Error("secret name phone");
          return {
            read: async () => {
              throw Error("secret name phone");
            },
            cancel: async () => {
              throw Error("secret cancellation");
            },
            releaseLock: () => {
              throw Error("secret release");
            },
          };
        },
      },
    });
    assert.equal(response.status, 400);
    assert.deepEqual(server.calls.logs, [["contacts: body_read"]]);
    assert.equal(server.calls.identities.length, 0);
  }
});

test("contacts namespace uses only opted-in canonical single trusted IPs", async () => {
  const cases = [
    [undefined, "x-real-ip", "192.0.2.1", "unknown"],
    ["other", "other", "192.0.2.1", "unknown"],
    ["x-real-ip", "x-forwarded-for", "192.0.2.1", "unknown"],
    ["x-real-ip", "x-real-ip", "192.0.2.1", "192.0.2.1"],
    ["x-forwarded-for", "x-forwarded-for", "2001:db8::1", "2001:db8::1"],
    ...[
      "bad",
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
    assert.deepEqual(server.calls.identities, [`contacts:${expected}`]);
  }
});

test("rate limit and infrastructure failures return controlled sanitized responses", async () => {
  const limited = api({ limited: true });
  const response = await limited.POST(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(limited.calls.queries.length, 0);
  for (const stage of ["rate_limit", "insert"]) {
    const server = api({ failRate: stage === "rate_limit", failInsert: stage === "insert" });
    const response = await server.POST(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Contact form unavailable." });
    assert.deepEqual(server.calls.logs, [[`contacts: ${stage}`]]);
  }
});

test("insertion is parameterized first-write-wins, stores minimal data and DB consent time", async () => {
  const server = api();
  const first = submission();
  const second = { ...first, name: "Otro nombre", phone: "9876543210" };
  for (const value of [first, second]) {
    assert.equal((await server.POST(request(JSON.stringify(value)))).status, 202);
  }
  for (const { sql, params } of server.calls.queries) {
    assert.match(sql, /on conflict \(client_submission_id\) do nothing/i);
    assert.match(sql, /insert into public\.contacts/i);
    assert.doesNotMatch(sql, /do update|returning|session|utm|email|website|analytics|events/i);
    assert.equal(params.length, 4);
    assert.equal(params[0], UUID);
    assert.equal(params[3], "contact-v1");
    assert.equal(sql.includes(params[1]), false);
  }
  const migration = readFileSync(
    new URL("../migrations/002_create_contacts.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /client_submission_id uuid primary key/);
  assert.match(migration, /consent_at timestamptz not null default now\(\)/);
  assert.match(migration, /consent_notice_version = 'contact-v1'/);
  assert.match(migration, /aclexplode\(coalesce\(c\.relacl, acldefault/);
  assert.match(migration, /a\.grantee = 0/);
  assert.match(migration, /then 0 else 1 end as contacts_public_acl_guard/);
});
