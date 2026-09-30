import { Container } from "@/components/layout/Container";

const links = [
  { label: "Objetivos", href: "#objetivos" },
  { label: "Modalidades", href: "#modalidades" },
  { label: "Método", href: "#metodo" },
  { label: "Instagram", href: "https://www.instagram.com/alejandro.ecm/", external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background-soft pt-10 pb-32 lg:pb-10">
      <Container className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-display text-2xl font-semibold tracking-[-0.02em] uppercase">
            Alejandro Carrizo
          </p>
          <p className="mt-2 text-sm text-muted">Personal Trainer · Capital Federal</p>
        </div>

        <nav aria-label="Enlaces del pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-muted sm:col-span-2">
          © {new Date().getFullYear()} Alejandro Carrizo. Todos los derechos reservados.
        </p>
      </Container>
    </footer>
  );
}
