import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";

const experiencePoints = [
  "8 años de experiencia",
  "Capacitación constante",
  "Técnica y ejecución correcta",
  "Progresión de menos a más",
  "Seguimiento de resultados",
  "Trabajo orientado a un entrenamiento seguro y eficiente",
];

const externalProfiles = [
  {
    label: "Instagram profesional",
    href: "https://www.instagram.com/alejandro.ecm/",
  },
  {
    label: "Servicio en Mercado Libre",
    href: "https://servicio.mercadolibre.com.ar/MLA-2042391577",
  },
];

export function Experience() {
  return (
    <section
      id="experiencia"
      aria-labelledby="experience-title"
      className="relative overflow-hidden bg-background-soft py-[var(--section-space)]"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <SectionTitle
              eyebrow="Experiencia"
              title={
                <span id="experience-title">
                  Entrenar con un plan <span className="text-accent">cambia todo</span>
                </span>
              }
            />
            <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Apasionado por el entrenamiento y la salud, con formación continua para ofrecer un
              trabajo cada vez más completo y actualizado.
            </p>

            <div className="mt-10 border-l-2 border-accent pl-6">
              <p className="text-sm leading-6 text-muted">
                También podés conocer más sobre el trabajo de Alejandro en sus perfiles públicos.
              </p>
              <ul className="mt-4 flex flex-col items-start gap-3">
                {externalProfiles.map((profile) => (
                  <li key={profile.href}>
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-sm font-bold tracking-[0.08em] text-foreground uppercase underline decoration-border underline-offset-4 transition-colors hover:text-accent"
                    >
                      {profile.label}
                      <span
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ol className="grid content-start gap-px bg-border sm:grid-cols-2">
            {experiencePoints.map((point, index) => (
              <li key={point} className="min-h-44 bg-surface p-6 sm:p-7">
                <span
                  className="font-display text-sm tracking-[0.16em] text-accent"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-8 font-display text-2xl leading-tight font-semibold uppercase sm:text-3xl">
                  {point}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
