import Image from "next/image";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import trainingImage from "@/filesDev/Foto1.png";

const trainingModes = [
  {
    title: "Online",
    description:
      "Entrenamiento personalizado a distancia, adaptado a tus posibilidades y objetivos.",
  },
  {
    title: "Gimnasio",
    description: "Podemos entrenar en un gimnasio que te resulte cómodo y conveniente.",
  },
  {
    title: "Gimnasio del edificio",
    description:
      "Si tu edificio cuenta con gimnasio, podemos aprovechar ese espacio para trabajar de manera personalizada.",
  },
  {
    title: "Domicilio",
    description:
      "Entrenamiento en tu domicilio siempre que dispongas de los elementos básicos necesarios.",
  },
];

export function TrainingModes() {
  return (
    <section
      id="modalidades"
      aria-labelledby="training-modes-title"
      className="overflow-hidden bg-surface py-[var(--section-space)]"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:gap-16">
          <SectionTitle
            eyebrow="Modalidades"
            title={
              <span id="training-modes-title">
                Entrená donde te resulte <span className="text-accent">más cómodo</span>
              </span>
            }
          />
          <p className="max-w-xl text-base leading-7 text-muted lg:pb-2 lg:text-lg lg:leading-8">
            El espacio cambia. El acompañamiento y la planificación se mantienen adaptados a vos.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] lg:items-stretch lg:gap-0">
          <figure className="relative min-h-[32rem] overflow-hidden bg-background lg:min-h-full">
            <Image
              src={trainingImage}
              alt="Alejandro Carrizo en una playa."
              fill
              sizes="(max-width: 1023px) 100vw, 42vw"
              className="scale-110 object-cover object-center brightness-[0.72] contrast-[1.08] saturate-[0.7]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/10 to-transparent"
              aria-hidden="true"
            />
            <figcaption className="absolute right-6 bottom-6 left-6 border-t border-white/25 pt-4 sm:right-8 sm:bottom-8 sm:left-8">
              <span className="font-display text-2xl font-semibold tracking-[-0.02em] text-white uppercase sm:text-3xl">
                Un plan. Distintos espacios.
              </span>
            </figcaption>
          </figure>

          <ol className="divide-y divide-border border border-border bg-background-soft lg:border-l-0">
            {trainingModes.map((mode, index) => (
              <li
                key={mode.title}
                className="group grid min-h-40 grid-cols-[2.5rem_1fr] gap-4 p-6 transition-colors duration-300 hover:bg-background sm:grid-cols-[3.5rem_1fr] sm:gap-6 sm:p-8"
              >
                <span
                  className="font-display text-sm tracking-[0.16em] text-accent"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-3xl leading-none font-semibold uppercase sm:text-4xl">
                    {mode.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                    {mode.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
