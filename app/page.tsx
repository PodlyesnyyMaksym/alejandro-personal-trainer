import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { ContactForm } from "@/components/sections/ContactForm";
import { Experience } from "@/components/sections/Experience";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { Goals } from "@/components/sections/Goals";
import { Method } from "@/components/sections/Method";
import { Philosophy } from "@/components/sections/Philosophy";
import { TrainingModes } from "@/components/sections/TrainingModes";
import { ValueProposition } from "@/components/sections/ValueProposition";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CONTACT_CONSENT_NOTICE } from "@/lib/contacts";

export default function Home() {
  const contactFormEnabled = process.env.CONTACT_FORM_ENABLED === "true";

  return (
    <>
      <main>
        <TrackPageView />
        <Hero />
        <ValueProposition />
        <Goals />
        <TrainingModes />
        <Method />
        <Philosophy />
        <Experience />
        {contactFormEnabled && (
          <ContactForm consentNotice={CONTACT_CONSENT_NOTICE}>
            <WhatsAppButton source="final_cta" variant="secondary" className="w-full sm:w-auto">
              Escribir por WhatsApp
            </WhatsAppButton>
          </ContactForm>
        )}
        <FinalCTA id={contactFormEnabled ? "final-cta" : "contacto"} />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
