import type { ReactNode, SVGProps } from "react";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

type GoalIconName = "health" | "fat" | "tone" | "muscle" | "strength" | "resistance";

type Goal = {
  title: string;
  description: string;
  icon: GoalIconName;
};

const goals: Goal[] = [
  {
    title: "Mejorar tu salud",
    description: "Construí una rutina que acompañe tu bienestar y las exigencias de cada día.",
    icon: "health",
  },
  {
    title: "Reducir porcentaje de grasa",
    description: "Combiná fuerza y acondicionamiento dentro de un plan progresivo.",
    icon: "fat",
  },
  {
    title: "Tonificar",
    description: "Trabajá fuerza, control y composición corporal desde tu punto de partida.",
    icon: "tone",
  },
  {
    title: "Ganar masa muscular",
    description: "Entrená con una progresión orientada al desarrollo muscular.",
    icon: "muscle",
  },
  {
    title: "Mejorar tu fuerza",
    description: "Desarrollá tu capacidad para mover cargas con técnica y control.",
    icon: "strength",
  },
  {
    title: "Mejorar tu resistencia",
    description: "Aumentá gradualmente tu capacidad para sostener distintos esfuerzos.",
    icon: "resistance",
  },
];

function GoalIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: GoalIconName }) {
  const paths: Record<GoalIconName, ReactNode> = {
    health: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    fat: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2M7.5 5.5l-2-2M16.5 5.5l2-2" />
      </>
    ),
    tone: <path d="M3 12h4l2-5 4 10 2-5h6M5 4v3M19 17v3" />,
    muscle: <path d="M7 9v6M4 10v4M17 9v6M20 10v4M7 12h10M2 12h2M20 12h2" />,
    strength: <path d="m6 10 6-6 6 6M12 4v16M5 20h14" />,
    resistance: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function Goals() {
  return (
    <section
      id="objetivos"
      aria-labelledby="goals-title"
      className="bg-background py-[var(--section-space)]"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-16">
          <SectionTitle
            eyebrow="Objetivos"
            title={
              <span id="goals-title">
                Trabajemos en lo que querés <span className="text-accent">mejorar</span>
              </span>
            }
          />
          <p className="max-w-xl text-base leading-7 text-muted lg:pb-2 lg:text-lg lg:leading-8">
            Cada objetivo requiere un punto de partida y una progresión diferente. El plan se ajusta
            a tus posibilidades y a tu ritmo.
          </p>
        </div>

        <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {goals.map((goal, index) => (
            <li
              key={goal.title}
              className="group relative min-h-64 overflow-hidden border border-border bg-background-soft p-6 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-accent/55 hover:bg-surface motion-reduce:hover:translate-y-0 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-full border border-border text-accent transition-colors duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-background">
                  <GoalIcon name={goal.icon} className="size-6" />
                </span>
                <span
                  className="font-display text-sm tracking-[0.16em] text-muted"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-8 font-display text-3xl leading-tight font-semibold uppercase">
                {goal.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{goal.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
