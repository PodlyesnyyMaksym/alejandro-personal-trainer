import { Container } from "@/components/layout/Container";

export function Philosophy() {
  return (
    <section
      id="filosofia"
      aria-labelledby="philosophy-title"
      className="relative overflow-hidden bg-accent py-[var(--section-space)] text-background"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 font-display text-[22rem] leading-none text-background/[0.045] select-none"
        aria-hidden="true"
      >
        +
      </div>

      <Container className="relative">
        <p className="mb-8 flex items-center gap-4 text-xs font-bold tracking-[0.2em] uppercase">
          <span className="h-px w-10 bg-background" aria-hidden="true" />
          Filosofía
        </p>

        <h2
          id="philosophy-title"
          className="max-w-6xl font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.045em] text-balance uppercase"
        >
          <span className="block">Entrenar no es solamente verse bien.</span>
          <span className="mt-4 block">Entrenar es salud.</span>
        </h2>

        <div className="mt-12 grid gap-6 border-t border-background/25 pt-7 md:grid-cols-[1fr_1fr] md:items-start">
          <p className="font-display text-xl font-semibold tracking-[0.08em] uppercase">
            Movimiento · Fuerza · Calidad de vida
          </p>
          <p className="max-w-xl text-base leading-7 md:justify-self-end md:text-lg md:leading-8">
            El objetivo es preparar tu cuerpo para sentirte mejor hoy y responder mejor a las
            exigencias de la vida diaria.
          </p>
        </div>
      </Container>
    </section>
  );
}
