import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

const steps = [
  {
    title: "Evaluamos tu punto de partida",
    description:
      "Conversamos sobre tu experiencia, tu rutina y las posibilidades con las que contás.",
  },
  {
    title: "Definimos tus objetivos",
    description: "Ordenamos prioridades y establecemos una dirección clara para el entrenamiento.",
  },
  {
    title: "Diseñamos tu entrenamiento",
    description: "Armamos un plan personalizado según tu contexto, modalidad y disponibilidad.",
  },
  {
    title: "Trabajamos técnica y progresión",
    description: "Aprendés cada movimiento y avanzamos de menos a más, respetando tu proceso.",
  },
  {
    title: "Medimos resultados",
    description: "Revisamos indicadores concretos para entender cómo evoluciona el trabajo.",
  },
  {
    title: "Ajustamos mes a mes",
    description: "Adaptamos el plan a tus avances, dificultades y nuevos objetivos.",
  },
];

export function Method() {
  return (
    <section
      id="metodo"
      aria-labelledby="method-title"
      className="bg-background py-[var(--section-space)]"
    >
      <Container className="grid gap-12 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <SectionTitle
            eyebrow="Método de trabajo"
            title={
              <span id="method-title">
                Un proceso claro para avanzar <span className="text-accent">paso a paso</span>
              </span>
            }
          />
          <p className="mt-6 max-w-md text-base leading-7 text-muted sm:text-lg sm:leading-8">
            La planificación le da sentido a cada sesión y permite ajustar el trabajo a medida que
            avanzás.
          </p>
        </div>

        <ol className="border-b border-border">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group grid gap-5 border-t border-border py-8 sm:grid-cols-[4rem_1fr] sm:gap-8 sm:py-10"
            >
              <span
                className="font-display text-lg tracking-[0.14em] text-accent"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-3xl leading-tight font-semibold uppercase sm:text-4xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
