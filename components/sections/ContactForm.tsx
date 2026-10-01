"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { Container } from "@/components/layout/Container";

type ContactFormProps = {
  consentNotice: string;
  children: ReactNode;
};

type Status = "idle" | "loading" | "success" | "error";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground disabled:opacity-60";

function readPayload(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? ""),
    phone: String(data.get("phone") ?? ""),
    consent: data.get("consent") === "on",
    website: String(data.get("website") ?? ""),
  };
}

export function ContactForm({ consentNotice, children }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const successfulPayload = useRef<string | null>(null);

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (pending.current) return;
    const key = JSON.stringify(readPayload(event.currentTarget));
    if (key === successfulPayload.current) {
      setStatus("success");
      setMessage("Recibimos tu consulta. Gracias por escribirnos.");
    } else {
      setStatus("idle");
      setMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (pending.current || !form.reportValidity()) return;
    const payload = readPayload(form);
    const key = JSON.stringify(payload);
    if (!payload.consent || key === successfulPayload.current) return;

    pending.current = true;
    setStatus("loading");
    setMessage("Enviando tu consulta…");
    try {
      if (attempt.current?.key !== key) {
        attempt.current = { key, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSubmissionId: attempt.current.id, ...payload }),
      });
      if (response.ok) {
        successfulPayload.current = key;
        setStatus("success");
        setMessage("Recibimos tu consulta. Gracias por escribirnos.");
      } else {
        setStatus("error");
        setMessage(
          response.status === 429
            ? "Hubo demasiados intentos. Esperá un momento antes de volver a enviar o escribinos por WhatsApp."
            : response.status === 503
              ? "El formulario no está disponible en este momento. Podés intentar más tarde o escribirnos por WhatsApp."
              : "No pudimos enviar tu consulta. Revisá los datos e intentá de nuevo o escribinos por WhatsApp.",
        );
      }
    } catch {
      setStatus("error");
      setMessage("No pudimos enviar tu consulta. Intentá de nuevo o escribinos por WhatsApp.");
    } finally {
      pending.current = false;
    }
  }

  return (
    <section
      id="contacto"
      aria-labelledby="contact-form-title"
      className="bg-background-soft py-[var(--section-space)]"
    >
      <Container className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
          Otra forma de contactarnos
        </p>
        <h2
          id="contact-form-title"
          className="mt-6 font-display text-4xl font-semibold uppercase sm:text-5xl"
        >
          Dejanos tu consulta
        </h2>
        <p id="contact-form-description" className="mt-6 leading-7 text-muted">
          Si preferís que te contactemos, completá este formulario voluntario. Todos los campos
          visibles son obligatorios.
        </p>
        <form
          method="post"
          action="/api/contacts"
          onSubmit={handleSubmit}
          onChange={handleChange}
          aria-describedby="contact-form-description"
          className="mt-8"
        >
          <fieldset disabled={status === "loading"} className="space-y-6">
            <legend className="sr-only">Datos para responder tu consulta</legend>
            <div>
              <label htmlFor="contact-name" className="font-semibold">
                Nombre
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="font-semibold">
                Teléfono
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                aria-describedby="contact-phone-help"
                pattern={String.raw`[0-9+ \(\)\-]+`}
                className={inputClassName}
              />
              <p id="contact-phone-help" className="mt-2 text-sm leading-6 text-muted">
                Ingresá tu teléfono en formato internacional, con el código de país. Usá entre 10 y
                15 dígitos; podés incluir +, espacios, paréntesis y guiones.
              </p>
            </div>
            <div hidden aria-hidden="true">
              <label htmlFor="contact-website">Sitio web</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <label htmlFor="contact-consent" className="flex items-start gap-3 text-sm leading-6">
              <input
                id="contact-consent"
                name="consent"
                type="checkbox"
                required
                className="mt-1 size-5 shrink-0 accent-accent"
              />
              <span>{consentNotice}</span>
            </label>
            <button
              type="submit"
              disabled={status === "success" || status === "loading"}
              className="min-h-12 w-full rounded-sm bg-accent px-6 py-3 font-bold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {status === "loading"
                ? "Enviando…"
                : status === "success"
                  ? "Consulta enviada"
                  : "Enviar consulta"}
            </button>
          </fieldset>
          <p role="alert" aria-atomic="true" className="mt-4 text-sm leading-6">
            {message}
          </p>
        </form>
        <noscript>
          <p className="mt-4 text-sm leading-6">
            El formulario necesita JavaScript. Podés escribirnos directamente por WhatsApp con el
            enlace de abajo.
          </p>
        </noscript>
        <div className="mt-8 border-t border-border pt-8">
          <p className="mb-4 leading-7 text-muted">
            También podés escribirnos directamente por WhatsApp.
          </p>
          {children}
        </div>
      </Container>
    </section>
  );
}
