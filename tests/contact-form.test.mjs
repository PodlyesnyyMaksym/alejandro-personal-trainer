import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const notice =
  "Usaremos tu nombre y teléfono para responder tu consulta sobre entrenamiento. El responsable es el dueño de este proyecto. Conservaremos los datos sin plazo fijo, hasta que el responsable decida eliminarlos o solicites su eliminación por WhatsApp. No te suscribimos a publicidad.";
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx, Fragment: "fragment" };

function load(path, globals, imports) {
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

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (typeof tree === "string") return tree;
  if (Array.isArray(tree)) return tree.map(text).join("");
  return text(tree?.props?.children ?? "");
}

function client(fetchImpl = async () => ({ ok: true, status: 202 })) {
  const slots = [];
  let cursor = 0;
  let ids = 0;
  const calls = [];
  const fallback = jsx("a", { href: "https://wa.me/configured", children: "WhatsApp" });
  const { ContactForm } = load(
    "components/sections/ContactForm.tsx",
    {
      // No storage, location, env, analytics or real network is available in this context.
      navigator: { doNotTrack: "1" },
      crypto: { randomUUID: () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++ids).padStart(12, "0")}` },
      FormData: class {
        constructor(form) {
          this.form = form;
        }
        get(key) {
          return this.form.values[key] ?? null;
        }
      },
      fetch(url, options) {
        calls.push({ url, ...options, payload: JSON.parse(options.body) });
        return fetchImpl();
      },
    },
    {
      "react/jsx-runtime": runtime,
      react: {
        useState(initial) {
          const index = cursor++;
          if (!(index in slots)) slots[index] = initial;
          return [
            slots[index],
            (value) => {
              slots[index] = value;
            },
          ];
        },
        useRef(initial) {
          const index = cursor++;
          if (!(index in slots)) slots[index] = { current: initial };
          return slots[index];
        },
      },
      "@/components/layout/Container": { Container: "container" },
    },
  );
  const form = {
    values: { name: "María", phone: "+123456789012", consent: "on", website: "" },
    reportValidity: () => true,
  };
  function render() {
    cursor = 0;
    return ContactForm({ consentNotice: notice, children: fallback });
  }
  function element(type) {
    return nodes(render()).find((node) => node.type === type);
  }
  return {
    calls,
    form,
    render,
    element,
    fallback,
    submit: () => element("form").props.onSubmit({ currentTarget: form, preventDefault() {} }),
    change(values) {
      Object.assign(form.values, values);
      element("form").props.onChange({ currentTarget: form });
    },
    alert: () => text(nodes(render()).find((node) => node.props?.role === "alert")),
  };
}

test("accessible required fields, exact server notice, hidden optional honeypot and permanent href", () => {
  const ui = client();
  const tree = ui.render();
  const all = nodes(tree);
  assert.equal(tree.props.id, "contacto");
  const form = all.find((node) => node.type === "form");
  assert.equal(form.props.method, "post");
  assert.equal(form.props.action, "/api/contacts");
  assert.ok(all.some((node) => node.type === "noscript"));
  const fields = Object.fromEntries(
    all.filter((n) => n.type === "input").map((n) => [n.props.name, n.props]),
  );
  for (const name of ["name", "phone", "consent"]) {
    assert.equal(fields[name].required, true);
    assert.ok(all.some((n) => n.type === "label" && n.props.htmlFor === fields[name].id));
  }
  assert.equal(fields.name.autoComplete, "name");
  assert.equal(fields.phone.autoComplete, "tel");
  assert.equal(fields.phone.type, "tel");
  const phonePattern = new RegExp(`^(?:${fields.phone.pattern})$`, "v");
  assert.ok(phonePattern.test("+12 (345) 678-9012"));
  assert.equal(phonePattern.test("1234567890 ext 12"), false);
  assert.match(
    text(all.find((n) => n.props?.id === fields.phone["aria-describedby"])),
    /internacional.*código de país/,
  );
  assert.equal(
    text(all.find((n) => n.type === "label" && n.props.htmlFor === fields.consent.id)),
    notice,
  );
  assert.equal(fields.website.tabIndex, -1);
  assert.equal(fields.website.required, undefined);
  assert.ok(
    all.some(
      (n) =>
        n.props?.hidden &&
        n.props["aria-hidden"] === "true" &&
        nodes(n).some((c) => c.props?.name === "website"),
    ),
  );
  assert.ok(all.includes(ui.fallback));
});

test("explicit submission works under DNT, prevents concurrent and successful duplicates, allows changed payload", async () => {
  let finish;
  const ui = client(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const request = ui.submit();
  assert.match(ui.alert(), /Enviando/);
  assert.equal(ui.element("fieldset").props.disabled, true);
  assert.ok(nodes(ui.render()).includes(ui.fallback));
  await ui.submit();
  assert.equal(ui.calls.length, 1);
  finish({ ok: true, status: 202 });
  await request;
  assert.match(ui.alert(), /Recibimos/);
  assert.ok(nodes(ui.render()).includes(ui.fallback));
  assert.equal(ui.element("button").props.disabled, true);
  await ui.submit();
  assert.equal(ui.calls.length, 1);
  ui.change({ name: "Otro nombre" });
  assert.equal(ui.element("button").props.disabled, false);
  ui.change({ name: "María" });
  await ui.submit();
  assert.equal(ui.calls.length, 1);
  ui.change({ phone: "+123456789013" });
  const next = ui.submit();
  finish({ ok: true, status: 202 });
  await next;
  assert.notEqual(ui.calls[0].payload.clientSubmissionId, ui.calls[1].payload.clientSubmissionId);
  const first = ui.calls[0];
  assert.equal(first.url, "/api/contacts");
  assert.equal(first.method, "POST");
  assert.equal(first.headers["Content-Type"], "application/json");
  assert.deepEqual(first.payload, {
    clientSubmissionId: "aaaaaaaa-aaaa-4aaa-8aaa-000000000001",
    name: "María",
    phone: "+123456789012",
    consent: true,
    website: "",
  });
});

for (const status of [429, 503, 400, 403, 413, 500, "network"]) {
  test(`sanitized ${status} error, persistent fallback and same-payload retry identity`, async () => {
    const ui = client(async () => {
      if (status === "network") throw Error("María +123456789012 secret");
      return {
        ok: false,
        status,
        json() {
          assert.fail("Response body must not be echoed");
        },
      };
    });
    await ui.submit();
    assert.match(
      ui.alert(),
      status === 429
        ? /demasiados intentos/
        : status === 503
          ? /no está disponible/
          : /No pudimos enviar/,
    );
    assert.doesNotMatch(ui.alert(), /María|123456789012|secret/);
    assert.ok(nodes(ui.render()).includes(ui.fallback));
    await ui.submit();
    assert.equal(ui.calls[0].payload.clientSubmissionId, ui.calls[1].payload.clientSubmissionId);
    ui.change({ name: "Cambio" });
    await ui.submit();
    assert.notEqual(ui.calls[1].payload.clientSubmissionId, ui.calls[2].payload.clientSubmissionId);
  });
}

test("invalid form or unchecked consent sends nothing", async () => {
  const ui = client();
  ui.form.reportValidity = () => false;
  await ui.submit();
  ui.form.reportValidity = () => true;
  ui.form.values.consent = null;
  await ui.submit();
  assert.equal(ui.calls.length, 0);
});

test("only exact server flag enables form, passes notice and shared server WhatsApp child, keeps CTA sources", () => {
  for (const flag of [undefined, "false", "TRUE", "1", " true", "", "true"]) {
    const imports = {
      "react/jsx-runtime": runtime,
    };
    for (const [folder, name] of [
      ["analytics", "TrackPageView"],
      ["layout", "Footer"],
      ["layout", "FloatingWhatsApp"],
      ...[
        "ContactForm",
        "Experience",
        "FinalCTA",
        "Hero",
        "Goals",
        "Method",
        "Philosophy",
        "TrainingModes",
        "ValueProposition",
      ].map((name) => ["sections", name]),
      ["ui", "WhatsAppButton"],
    ]) {
      imports[`@/components/${folder}/${name}`] = {
        [name]:
          name === "FinalCTA"
            ? () =>
                jsx("section", { id: "contacto", children: jsx("cta", { source: "final_cta" }) })
            : name,
      };
    }
    imports["@/lib/contacts"] = { CONTACT_CONSENT_NOTICE: notice };
    const { default: Home } = load(
      "app/page.tsx",
      { process: { env: { CONTACT_FORM_ENABLED: flag } } },
      imports,
    );
    const page = Home();
    assert.equal(page.props.children[0].type, "main");
    assert.equal(page.props.children[1].type, "Footer");
    assert.equal(
      nodes(page.props.children[0]).some((node) => node.type === "Footer"),
      false,
    );
    const all = nodes(page);
    const form = all.find((n) => n.type === "ContactForm");
    assert.equal(Boolean(form), flag === "true");
    assert.ok(all.some((n) => n.type === "Hero"));
    assert.ok(all.some((n) => n.type === "FloatingWhatsApp"));
    if (form) {
      assert.equal(form.props.consentNotice, notice);
      assert.equal(form.props.children.type, "WhatsAppButton");
      assert.equal(form.props.children.props.source, "final_cta");
      assert.equal(all.find((n) => typeof n.type === "function").props.id, "final-cta");
    } else assert.ok(all.some((n) => typeof n.type === "function"));
  }
});
