import assert from "node:assert/strict";
import test from "node:test";
import { cleanupContactProbe } from "../scripts/cleanup-contact-probe.mjs";

test("deployment cleanup requires reserved UUID and both synthetic values", async () => {
  let ended = false;
  let calls = 0;
  const count = await cleanupContactProbe({
    async query(sql, values) {
      calls++;
      assert.match(sql, /client_submission_id=\$1 and name=\$2 and phone=\$3/);
      assert.deepEqual(values, [
        "00000000-0000-4000-8000-000000000002",
        "PRUEBA DE DEPLOY - NO ES UN CLIENTE",
        "0000000000",
      ]);
      return { rowCount: 1 };
    },
    async end() {
      ended = true;
    },
  });
  assert.equal(calls, 1);
  assert.equal(count, 1);
  assert.equal(ended, true);
});

test("cleanup errors close the pool and propagate without reading contacts", async () => {
  let ended = false;
  await assert.rejects(
    cleanupContactProbe({
      async query() {
        throw new Error("simulated failure");
      },
      async end() {
        ended = true;
      },
    }),
    /simulated failure/,
  );
  assert.equal(ended, true);
});
