import "server-only";

import { queryDatabase } from "@/lib/database";

// Keep the visible consent notice and the persisted version paired.
export const CONTACT_CONSENT_NOTICE =
  "Usaremos tu nombre y teléfono para responder tu consulta sobre entrenamiento. El responsable es el dueño de este proyecto. Conservaremos los datos sin plazo fijo, hasta que el responsable decida eliminarlos o solicites su eliminación por WhatsApp. No te suscribimos a publicidad.";
export const CONTACT_CONSENT_NOTICE_VERSION = "contact-v1";

export type ContactSubmission = {
  clientSubmissionId: string;
  name: string;
  phone: string;
  consent: true;
  website: "";
};

const KEYS = ["clientSubmissionId", "name", "phone", "consent", "website"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

export function parseContactSubmission(value: unknown): ContactSubmission | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).length !== KEYS.length ||
    !KEYS.every((key) => Object.hasOwn(input, key))
  ) {
    return null;
  }
  if (
    typeof input.clientSubmissionId !== "string" ||
    !UUID_PATTERN.test(input.clientSubmissionId) ||
    typeof input.name !== "string" ||
    CONTROL_PATTERN.test(input.name) ||
    typeof input.phone !== "string" ||
    !/^[0-9+ ()-]+$/.test(input.phone) ||
    input.consent !== true ||
    input.website !== ""
  ) {
    return null;
  }

  const name = input.name.trim();
  const phone = input.phone.replace(/[ ()-]/g, "");
  if (
    Array.from(name).length < 1 ||
    Array.from(name).length > 100 ||
    !/^\+?[0-9]{10,15}$/.test(phone)
  ) {
    return null;
  }
  return { clientSubmissionId: input.clientSubmissionId, name, phone, consent: true, website: "" };
}

export async function insertContact(contact: ContactSubmission) {
  await queryDatabase(
    `
      insert into public.contacts (client_submission_id, name, phone, consent_notice_version)
      values ($1, $2, $3, $4)
      on conflict (client_submission_id) do nothing
    `,
    [contact.clientSubmissionId, contact.name, contact.phone, CONTACT_CONSENT_NOTICE_VERSION],
  );
}
