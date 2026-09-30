import "server-only";

export const WHATSAPP_CONFIG = {
  defaultMessage:
    "Hola Alejandro, vi tu página y quería consultarte por entrenamiento personalizado.",
} as const;

function getPhone() {
  const phone = process.env.WHATSAPP_PHONE?.replace(/\D/g, "");

  if (!phone || phone.length < 10 || phone.length > 15) {
    throw new Error("WHATSAPP_PHONE debe contener entre 10 y 15 dígitos.");
  }

  return phone;
}

export function getWhatsAppUrl(message: string = WHATSAPP_CONFIG.defaultMessage) {
  const query = new URLSearchParams({ text: message });

  return `https://wa.me/${getPhone()}?${query.toString()}`;
}
