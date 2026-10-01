import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function limiter({ minute = "123456", count = 30, secret = "x".repeat(32) } = {}) {
  const source = readFileSync(new URL("../lib/rate-limit.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  const calls = [];
  vm.runInNewContext(outputText, {
    exports,
    process: { env: { RATE_LIMIT_SECRET: secret } },
    require(name) {
      if (name === "server-only") return {};
      if (name === "node:crypto") return { createHmac };
      if (name === "@/lib/database") {
        return {
          async queryDatabase(sql, values) {
            calls.push({ sql, values });
            return calls.length === 1
              ? { rows: [{ minute }] }
              : { rows: [{ request_count: count }] };
          },
        };
      }
      throw Error("Unexpected import");
    },
  });
  return { ...exports, calls };
}

test("bucket and timestamp use the same database minute", async () => {
  const server = limiter();
  assert.equal(await server.isRateLimited("unknown"), false);
  assert.match(server.calls[0].sql, /clock_timestamp/);
  const expected = createHmac("sha256", "x".repeat(32)).update("unknown:123456").digest("hex");
  assert.deepEqual(Array.from(server.calls[1].values), [expected, 123456]);
  assert.match(server.calls[1].sql, /to_timestamp\(\$2/);
});

test("31st request is limited", async () => {
  assert.equal(await limiter({ count: 31 }).isRateLimited("unknown"), true);
});

test("invalid database clock fails closed", async () => {
  const server = limiter({ minute: "invalid" });
  await assert.rejects(server.isRateLimited("unknown"), /clock unavailable/);
  assert.equal(server.calls.length, 1);
});

test("short secret cannot create a bucket", async () => {
  const server = limiter({ secret: "short" });
  await assert.rejects(server.isRateLimited("unknown"), /at least 32/);
  assert.equal(server.calls.length, 1);
});
