import Image from "next/image";

import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import heroImage from "@/filesDev/Foto2.png";

const highlights = ["+8 años de experiencia", "Online y presencial", "Capital Federal"];

export function Hero() {
  return (
    <section className="relative isolate min-h-svh overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 82% 16%, rgba(201, 166, 107, 0.2), transparent 28%), linear-gradient(115deg, transparent 55%, rgba(255, 255, 255, 0.025) 55%)",
        }}
      />

      <Container className="grid min-h-svh items-center gap-12 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-16 lg:py-12">
        <div className="relative z-10 pt-6 lg:pt-0">
          <div className="mb-10 flex items-center gap-4 text-xs font-bold tracking-[0.18em] text-muted uppercase">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            Alejandro Carrizo
          </div>

          <Badge>Entrenamiento personalizado</Badge>

          <SectionTitle
            as="h1"
            size="hero"
            className="mt-7"
            eyebrow="Personal Trainer"
            title={
              <>
                <span className="block">Transformá tu cuerpo.</span>
                <span className="block text-accent">Mejorá tu salud.</span>
              </>
            }
            description="Entrenamiento personalizado para mejorar tu fuerza, condición física y salud de manera progresiva, segura y medible."
          />

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton source="hero_primary" className="w-full sm:w-auto">
              Quiero empezar
            </WhatsAppButton>
            <WhatsAppButton
              source="hero_secondary"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Hablar por WhatsApp
            </WhatsAppButton>
          </div>

          <ul
            className="mt-10 grid gap-4 border-t border-border pt-6 text-sm text-muted sm:grid-cols-3"
            aria-label="Información destacada"
          >
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div
            className="absolute -inset-3 -z-10 border border-accent/30 sm:-inset-5"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/5] overflow-hidden bg-surface shadow-soft">
            <Image
              src={heroImage}
              alt="Alejandro Carrizo con indumentaria deportiva en un balcón urbano."
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 45vw"
              className="scale-110 object-cover object-[54%_center] brightness-[0.82] contrast-[1.05] saturate-[0.75]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/65 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>
          <figcaption className="absolute right-4 bottom-4 left-4 flex items-center justify-between border-t border-white/20 pt-3 text-[0.65rem] font-bold tracking-[0.16em] text-white/75 uppercase sm:right-6 sm:bottom-6 sm:left-6">
            <span>Buenos Aires</span>
            <span>Online · Presencial</span>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
