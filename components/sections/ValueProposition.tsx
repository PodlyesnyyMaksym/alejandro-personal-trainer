import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Stat } from "@/components/ui/Stat";

const stats = [
  { value: "+8", label: "años de experiencia" },
  { value: "100%", label: "personalizado" },
  { value: "4", label: "modalidades de entrenamiento" },
];

export function ValueProposition() {
  return (
    <section
      id="propuesta"
      aria-labelledby="value-proposition-title"
      className="relative overflow-hidden bg-background-soft py-[var(--section-space)]"
    >
      <div
        className="pointer-events-none absolute top-0 right-0 h-full w-px bg-linear-to-b from-accent/50 via-border to-transparent lg:right-[12%]"
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.75fr)] lg:items-end lg:gap-20">
          <SectionTitle
            eyebrow="Un plan que se adapta"
            title={
              <span id="value-proposition-title">
                Entrenamiento hecho <span className="text-accent">para vos</span>
              </span>
            }
          />

          <div className="border-l-2 border-accent pl-6 sm:pl-8">
            <p className="text-xl leading-8 font-medium text-foreground sm:text-2xl sm:leading-9">
              Cada persona tiene un punto de partida, una rutina y un objetivo distinto.
            </p>
            <p className="mt-5 leading-7 text-muted sm:text-lg sm:leading-8">
              El entrenamiento se adapta a vos, con una progresión planificada para que puedas
              mejorar mes a mes.
            </p>
          </div>
        </div>

        <dl className="mt-14 grid gap-px bg-border sm:grid-cols-3 lg:mt-20">
          {stats.map((stat) => (
            <Stat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </dl>
      </Container>
    </section>
  );
}
