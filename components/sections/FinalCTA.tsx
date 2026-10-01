import { Container } from "@/components/layout/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export function FinalCTA({ id = "contacto" }: { id?: string } = {}) {
  return (
    <section
      id={id}
      aria-labelledby="final-cta-title"
      className="relative overflow-hidden bg-background py-[var(--section-space)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 85%, rgba(201, 166, 107, 0.19), transparent 30%)",
        }}
      />

      <Container className="relative text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">¿Empezamos?</p>
        <h2
          id="final-cta-title"
          className="mx-auto mt-6 max-w-5xl font-display text-[clamp(4rem,13vw,10rem)] leading-[0.82] font-semibold tracking-[-0.05em] text-balance uppercase"
        >
          Tu cambio <span className="text-accent">empieza hoy.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-muted sm:text-xl sm:leading-8">
          Contame cuál es tu objetivo y vemos juntos cuál es la mejor manera de empezar.
        </p>
        <div className="mt-10 flex justify-center">
          <WhatsAppButton source="final_cta" className="w-full sm:w-auto sm:min-w-64">
            Hablar con Alejandro
          </WhatsAppButton>
        </div>
      </Container>
    </section>
  );
}
