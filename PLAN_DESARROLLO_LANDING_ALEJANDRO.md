# Plan de desarrollo — Landing Page Alejandro Carrizo Personal Trainer

## 1. Objetivo del proyecto

Desarrollar una landing page moderna, visual, rápida y orientada a conversión para Alejandro Carrizo, Personal Trainer con 8 años de experiencia.

La página debe:

- Presentar el servicio de entrenamiento personal de forma clara y profesional.
- Generar confianza.
- Mostrar modalidades de entrenamiento:
  - Online.
  - Gimnasios.
  - Gimnasios de edificios.
  - Domicilios con elementos básicos.
- Explicar la metodología de trabajo.
- Destacar objetivos posibles:
  - Mejorar salud.
  - Reducir porcentaje de grasa.
  - Tonificar.
  - Ganar masa muscular.
  - Mejorar fuerza.
  - Mejorar resistencia.
- Facilitar el contacto mediante WhatsApp.
- Medir los clicks de WhatsApp de forma invisible para el usuario, salvo cuando corresponda respetar `Do Not Track`.
- Registrar estadísticas de interacción.
- Permitir enviar resúmenes o alertas mediante Telegram.
- Tener muy buena experiencia mobile.
- Ser fácil de mantener y ampliar.

## 1.1 Jerarquía de requisitos

Para evitar contradicciones durante la implementación, interpretar el documento con esta prioridad:

1. Requisitos obligatorios y criterios de aceptación.
2. Decisiones de producto confirmadas.
3. Reglas de seguridad, privacidad y accesibilidad.
4. Guías de implementación.
5. Ejemplos conceptuales y sugerencias visuales.

Las palabras clave se interpretan así:

- **Debe**: requisito obligatorio para cerrar la fase.
- **Debería**: recomendación que puede cambiarse con una razón documentada.
- **Posterior**: queda fuera del alcance de la versión indicada.

Ante una contradicción, no asumir: registrar la decisión y actualizar este documento para mantener una única fuente de verdad.

## 1.2 Seguimiento de fases

Esta es la única checklist de estado del proyecto. Debe actualizarse al comenzar y terminar cada fase para que una nueva sesión pueda retomar el trabajo sin depender del contexto anterior.

Estados:

- `[ ] Fase`: pendiente.
- `[ ] Fase — EN CURSO`: iniciada pero todavía no aprobada.
- `[x] Fase — COMPLETADA YYYY-MM-DD`: finalizada, verificada y aprobada.

No marcar una fase como completada hasta satisfacer sus criterios de finalización y ejecutar las verificaciones disponibles. Si el proyecto ya está inicializado, esto incluye `npm run lint` y `npm run build`. Registrar bloqueos debajo de la fase correspondiente, sin marcarla como completada.

- [x] Fase previa — Decisiones e insumos — COMPLETADA 2026-09-22.
- [x] Fase 0 — Inicialización — COMPLETADA 2026-09-22.
- [x] Fase 1 — Diseño base — COMPLETADA 2026-09-22.
- [x] Fase 2 — Hero — COMPLETADA 2026-09-22.
- [x] Fase 3 — Propuesta de valor — COMPLETADA 2026-09-22.
- [x] Fase 4 — Objetivos — COMPLETADA 2026-09-22.
- [x] Fase 5 — Modalidades — COMPLETADA 2026-09-22.
- [x] Fase 6 — Método de trabajo — COMPLETADA 2026-09-22.
- [x] Fase 7 — Filosofía — COMPLETADA 2026-09-22.
- [x] Fase 8 — Experiencia — COMPLETADA 2026-09-22.
- [x] Fase 9 — CTA final — COMPLETADA 2026-09-22.
- [x] Fase 10 — Botón flotante WhatsApp — COMPLETADA 2026-09-22.
- [x] Fase 11 — Integración WhatsApp — COMPLETADA 2026-09-22.
- [ ] Fase 12 — Analytics interno — EN CURSO.
- [ ] Fase 13 — Telegram.
- [ ] Fase 14 — SEO.
- [ ] Fase 15 — Imágenes.
- [ ] Fase 16 — Animaciones.
- [ ] Fase 17 — Responsive.
- [ ] Fase 18 — Seguridad.
- [ ] Fase 19 — Testing.
- [ ] Fase 20 — Deploy.

---

# 2. Stack recomendado

Usar:

- Next.js con App Router.
- TypeScript.
- Tailwind CSS.
- Motion / Framer Motion para animaciones.
- Prisma PostgreSQL administrado desde Deno Deploy para guardar eventos, mediante SQL directo con `pg` y sin Prisma ORM.
- Telegram Bot API para avisos y estadísticas.
- Deno Deploy para deploy.
- ESLint.
- Prettier.
- Git.

Evitar dependencias innecesarias.

No incorporar GSAP en la primera versión salvo que una animación concreta realmente lo requiera.

---

# 3. Principios de desarrollo

## 3.1 Mobile first

Diseñar primero para teléfono.

El flujo principal esperado es:

```text
Instagram / anuncio / link
        ↓
Landing mobile
        ↓
Interacción
        ↓
WhatsApp
```

La experiencia desktop debe ser excelente, pero mobile tiene prioridad.

---

## 3.2 Performance

Objetivos:

- Lighthouse Performance >= 90.
- Lighthouse Accessibility >= 90.
- Lighthouse Best Practices >= 90.
- Lighthouse SEO >= 90.
- Evitar JavaScript innecesario.
- Optimizar imágenes.
- Usar `next/image`.
- Lazy loading cuando corresponda.
- No cargar animaciones pesadas al inicio.
- Core Web Vitals en el percentil 75, una vez disponible tráfico real:
  - LCP menor a 2,5 s.
  - CLS menor a 0,1.
  - INP menor a 200 ms.

Medir Lighthouse sobre el build de producción, en mobile, documentando dispositivo y condiciones de red. Los puntajes locales son una referencia, no sustituyen las métricas de usuarios reales.

Definir antes del deploy un presupuesto de peso para el hero y las imágenes principales. Toda imagen debe declarar dimensiones y un atributo `sizes` coherente con el layout.

---

## 3.3 Accesibilidad

Implementar:

- HTML semántico.
- `aria-label` cuando corresponda.
- Contraste correcto.
- Navegación por teclado.
- Estados de focus visibles.
- Respetar `prefers-reduced-motion`.
- Botones con labels claros.
- Imágenes con `alt`.

---

## 3.4 Tracking obligatorio en CTA

Todo botón que abra WhatsApp debe pasar por un componente común.

No usar links directos a WhatsApp distribuidos por la aplicación.

Componente único:

```text
WhatsAppButton
```

Responsabilidades:

1. Renderizar un enlace real y accesible a WhatsApp.
2. Abrir WhatsApp directamente desde el gesto del usuario.
3. Registrar el evento, origen y campaña/UTM sin bloquear la navegación.
4. Mantener el enlace operativo si JavaScript o tracking fallan.

---

# 4. Identidad visual

La referencia visual actual utiliza:

- Negro.
- Gris oscuro.
- Tonos cálidos.
- Dorado / beige.
- Fotografía deportiva.
- Tipografía grande.
- Contraste alto.

Mantener esa dirección visual, pero modernizarla.

## 4.1 Paleta sugerida

Crear variables CSS.

Ejemplo conceptual:

```css
--background: #0d0d0d;
--background-soft: #161616;
--foreground: #f4f1eb;
--muted: #a8a39b;
--accent: #c4a367;
--accent-hover: #d2b57d;
--border: rgba(255,255,255,.10);
```

No tomar estos valores como definitivos sin probar visualmente.

---

## 4.2 Tipografía

Buscar una combinación moderna.

Sugerencia:

- Titulares: sans serif fuerte, condensada o semi-condensada.
- Texto: sans serif limpia y muy legible.

Priorizar Google Fonts disponibles mediante `next/font`.

Ejemplos:

- Bebas Neue + Inter.
- Oswald + Inter.
- Anton + Manrope.
- Archivo Black + Inter.

Elegir una sola combinación y mantener consistencia.

---

# 5. Arquitectura del proyecto

Estructura inicial sugerida:

```text
alejandro-personal-trainer/
│
├── app/
│   ├── api/
│   │   └── events/
│   │       └── route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   │
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── ValueProposition.tsx
│   │   ├── Goals.tsx
│   │   ├── TrainingModes.tsx
│   │   ├── Method.tsx
│   │   ├── Philosophy.tsx
│   │   ├── Experience.tsx
│   │   └── FinalCTA.tsx
│   │
│   ├── ui/
│   │   ├── SectionTitle.tsx
│   │   ├── Reveal.tsx
│   │   ├── Stat.tsx
│   │   └── WhatsAppButton.tsx
│   │
│   └── analytics/
│       └── TrackPageView.tsx
│
├── lib/
│   ├── analytics.ts
│   ├── env.ts
│   ├── database.ts
│   ├── rate-limit.ts
│   ├── telegram.ts
│   └── utils.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── og/
│
├── types/
│   └── analytics.ts
│
├── migrations/
│   └── 001_create_events.sql
│
├── scripts/
│   └── migrate.mjs
│
├── .env.example
├── deno.json
├── .env.local
├── README.md
├── package.json
└── tsconfig.json
```

## 5.1 Fase previa — Decisiones e insumos

Antes de cerrar el diseño visual deben estar confirmados o marcados explícitamente como bloqueantes:

- Número de WhatsApp.
- Fotografías disponibles, calidad y derechos de uso.
- Autorización para publicar imágenes de alumnos, si las hubiera.
- Modalidades definitivas.
- Barrios o área real de cobertura.
- Biografía y años de experiencia aprobados por Alejandro.
- Certificaciones, testimonios o perfiles profesionales que puedan verificarse.
- Dominio deseado.
- Responsables y accesos de Deno Deploy, Prisma PostgreSQL y Telegram.

No inventar contenido si falta un insumo. Se permiten placeholders claramente marcados durante desarrollo, pero no en producción.

### Insumos confirmados

- WhatsApp: `5491151546705`.
- Cobertura: Capital Federal, Buenos Aires.
- Instagram: `https://www.instagram.com/alejandro.ecm/`.
- Mercado Libre: `https://servicio.mercadolibre.com.ar/MLA-2042391577`, como prueba de confianza secundaria.
- Modalidades: online, gimnasio, gimnasio de edificio y domicilio con elementos básicos.
- Trayectoria declarada y aprobada: 8 años de experiencia.
- Fotografías autorizadas disponibles en `filesDev/`.

### Decisiones pendientes no bloqueantes

- Dominio definitivo: resolver antes del deploy.
- Certificaciones y testimonios: no mostrar hasta recibir material verificable y autorizado.
- Accesos a Deno Deploy y Telegram: resolver antes de la release que los necesite. La base Prisma PostgreSQL se adjunta a la app de Deno Deploy.

---

# 6. Fase 0 — Inicialización

## Objetivo

Crear un proyecto limpio, funcional y listo para empezar.

## Tareas

1. Crear el proyecto Next.js con TypeScript.
2. Activar App Router.
3. Instalar Tailwind.
4. Instalar Motion.
5. Configurar ESLint.
6. Configurar Prettier.
7. Crear estructura de carpetas.
8. Crear `.env.example`.
9. Verificar que `.env.local` esté ignorado por Git.
10. Crear README inicial.
11. Configurar alias de imports.
12. Verificar build.
13. Crear commit inicial.

## Criterio de finalización

Debe funcionar:

```bash
npm run dev
npm run lint
npm run build
```

Sin errores.

---

# 7. Fase 1 — Diseño base

## Objetivo

Definir sistema visual consistente antes de animaciones.

## Tareas

1. Crear variables CSS.
2. Definir:
   - colores.
   - tamaños de texto.
   - espacios.
   - radios.
   - sombras.
3. Configurar tipografías con `next/font`.
4. Definir ancho máximo general.
5. Definir breakpoints.
6. Crear componentes básicos:
   - Container.
   - SectionTitle.
   - Button.
   - Badge.
7. Crear fondos oscuros diferenciados por sección.

## Reglas

- Evitar más de 2 familias tipográficas.
- Evitar exceso de sombras.
- Evitar gradientes innecesarios.
- Priorizar contraste.
- Mantener diseño premium y deportivo.

## Decisiones implementadas

- Titulares: Oswald mediante `next/font`.
- Texto: Manrope mediante `next/font`.
- Fondo principal carbón cálido `#0c0b0a`.
- Superficies diferenciadas `#151310` y `#1b1814`.
- Acento arena/dorado `#c9a66b`, con hover `#ddbd82`.
- Ancho máximo general: `75rem`.
- Breakpoints: `40rem`, `48rem`, `64rem` y `80rem`.
- Espaciado vertical fluido mediante `clamp()`.
- Radios contenidos y una única sombra suave.
- Componentes creados: `Container`, `SectionTitle`, `Button` y `Badge`.
- Focus visible y fallback global para `prefers-reduced-motion`.

---

# 8. Fase 2 — Hero

## Objetivo

Crear una primera pantalla impactante.

## Contenido

Nombre:

```text
ALEJANDRO CARRIZO
```

Rol:

```text
PERSONAL TRAINER
```

Titular sugerido:

```text
Transformá tu cuerpo.
Mejorá tu salud.
```

Texto secundario:

```text
Entrenamiento personalizado para mejorar tu fuerza, condición física y salud de manera progresiva, segura y medible.
```

CTA principal:

```text
Quiero empezar
```

Destino: WhatsApp.

Tracking:

```text
source = hero_primary
event_type = whatsapp_click
```

CTA secundario:

```text
Hablar por WhatsApp
```

Destino: WhatsApp.

Tracking:

```text
source = hero_secondary
event_type = whatsapp_click
```

Datos rápidos:

```text
+8 años de experiencia
Online y presencial
Capital Federal
```

## Diseño

- Foto de Alejandro ocupando una parte importante del hero.
- Fondo oscuro.
- Contraste fuerte.
- Texto grande.
- Accent dorado/beige.
- Evitar saturación visual.

## Interacciones

- Entrada progresiva del título.
- Entrada suave del texto.
- CTA con hover.
- Imagen con parallax muy sutil en desktop.
- Sin efecto pesado en mobile.

## Tracking

No agrupar ambos CTA bajo una única fuente. Deben poder compararse por separado:

```text
hero_primary
hero_secondary
```

## Decisiones implementadas

- `Foto2.png` se utiliza como imagen principal mediante `next/image`, con prioridad y `sizes` responsive.
- El recorte y escalado visual ocultan los controles incluidos en la captura original.
- La composición apila contenido e imagen en mobile y usa dos columnas desde desktop.
- Ambos CTA renderizan un `href` real mediante el componente compartido `WhatsAppButton`.
- El número se lee desde `WHATSAPP_PHONE`; no se distribuyen URLs hardcodeadas en componentes.
- Los CTA conservan `hero_primary` y `hero_secondary` como sources separados.
- El tracking se incorporará en la Fase 12; el enlace ya funciona sin JavaScript.
- Las entradas y el parallax quedan deliberadamente para la Fase 16, evitando adelantar la capa de animación.

---

# 9. Fase 3 — Propuesta de valor

## Contenido

Título:

```text
ENTRENAMIENTO HECHO PARA VOS
```

Texto:

```text
Cada persona tiene un punto de partida, una rutina y un objetivo distinto.

El entrenamiento se adapta a vos, con una progresión planificada para que puedas mejorar mes a mes.
```

Stats:

```text
+8
años de experiencia

100%
personalizado

4
modalidades de entrenamiento
```

## Interacción

Los números pueden animarse cuando entran en viewport.

No exagerar la animación.

## Decisiones implementadas

- Sección semántica `ValueProposition` integrada inmediatamente después del Hero.
- Copy dividido en titular y bloque editorial para mejorar la lectura mobile.
- Estadísticas representadas mediante un `<dl>` y el componente reusable `Stat`.
- Grid de una columna en mobile y tres columnas desde `sm`.
- Fondo `background-soft` para separar visualmente la sección sin usar gradientes decorativos excesivos.
- Valores estáticos y legibles sin JavaScript; la animación numérica queda reservada para la Fase 16.

---

# 10. Fase 4 — Objetivos

## Objetivo

Mostrar rápidamente qué necesidades puede cubrir el servicio.

Crear cards para:

- Mejorar salud.
- Bajar porcentaje de grasa.
- Tonificar.
- Ganar masa muscular.
- Mejorar fuerza.
- Mejorar resistencia.

## Diseño

Grid responsive.

Desktop:

```text
3 x 2
```

Mobile:

```text
1 columna
```

o máximo 2 columnas si visualmente funciona bien.

## Interacción

Hover ligero:

- translate.
- borde.
- fondo.
- ícono.

No hacer cards excesivamente altas.

## Decisiones implementadas

- Sección semántica `Goals` integrada después de la propuesta de valor.
- Seis cards con títulos y microcopy sin garantías de resultado.
- Grid de una columna en mobile, dos desde `md` y tres desde `lg`.
- Iconografía SVG propia, decorativa y sin dependencias externas.
- Hover ligero sobre posición, borde, fondo e ícono; se anula el desplazamiento con reduced motion.
- Implementación estática, sin JavaScript de cliente.

---

# 11. Fase 5 — Modalidades

## Contenido

### Online

```text
Entrenamiento personalizado a distancia, adaptado a tus posibilidades y objetivos.
```

### Gimnasio

```text
Podemos entrenar en un gimnasio que te resulte cómodo y conveniente.
```

### Gimnasio del edificio

```text
Si tu edificio cuenta con gimnasio, podemos aprovechar ese espacio para trabajar de manera personalizada.
```

### Domicilio

```text
Entrenamiento en tu domicilio siempre que dispongas de los elementos básicos necesarios.
```

## Diseño

Usar fotografía o fondos grandes.

Posible estructura:

```text
imagen | contenido
contenido | imagen
```

Alternar lados en desktop.

Apilar en mobile.

## Decisiones implementadas

- Sección `TrainingModes` integrada después de Objetivos.
- Una fotografía real de Alejandro funciona como ancla editorial común, evitando asociar imágenes no verificadas con cada modalidad.
- Cuatro bloques numerados con el copy aprobado para online, gimnasio, gimnasio de edificio y domicilio.
- Composición apilada en mobile y layout imagen/contenido en dos columnas desde desktop.
- `Foto1.png` utiliza `next/image`, `sizes` responsive y un recorte que oculta los controles de la captura original.
- Implementación estática y semántica, sin JavaScript de cliente ni dependencias nuevas.

---

# 12. Fase 6 — Método de trabajo

## Objetivo

Explicar el proceso y convertir la experiencia en algo concreto.

Pasos:

```text
01
Evaluamos tu punto de partida

02
Definimos tus objetivos

03
Diseñamos tu entrenamiento

04
Trabajamos técnica y progresión

05
Medimos resultados

06
Ajustamos mes a mes
```

## Diseño

Esta sección puede ser una de las principales experiencias de scroll.

Desktop:

- Columna izquierda sticky con título.
- Columna derecha con pasos.
- Paso activo resaltado según scroll.

Mobile:

- Flujo vertical tradicional.
- Sin sticky complejo.

## Reglas

La interacción no debe impedir:

- scroll normal.
- uso con teclado.
- lectura sencilla.

## Decisiones implementadas

- Sección `Method` con seis pasos, numeración visible y descripciones breves.
- Flujo vertical natural en mobile y título sticky solo desde desktop.
- Sin interceptar scroll, foco ni navegación por teclado.
- El resaltado dinámico por viewport queda reservado para la Fase 16.
- Implementación estática y sin JavaScript de cliente.

---

# 13. Fase 7 — Filosofía

Utilizar una sección visual muy simple y contundente.

Texto protagonista:

```text
Entrenar no es solamente verse bien.

Entrenar es salud.
```

Texto secundario:

```text
El objetivo es preparar tu cuerpo para sentirte mejor hoy y responder mejor a las exigencias de la vida diaria.
```

Puede usarse:

- fondo fotográfico.
- overlay oscuro.
- tipografía enorme.
- entrada con scroll.

## Decisiones implementadas

- Sección tipográfica de alto contraste con fondo arena/dorado, sin repetir fotografías.
- Titular y texto secundario completos, legibles sin efectos o JavaScript.
- La entrada con scroll queda reservada para la Fase 16.

---

# 14. Fase 8 — Experiencia

## Contenido

Título:

```text
ENTRENAR CON UN PLAN
CAMBIA TODO
```

Puntos:

```text
8 años de experiencia

Capacitación constante

Técnica y ejecución correcta

Progresión de menos a más

Seguimiento de resultados

Entrenamiento seguro y eficiente
```

## Texto complementario

```text
Apasionado por el entrenamiento y la salud, con formación continua para ofrecer un trabajo cada vez más completo y actualizado.
```

## Confianza verificable

Antes de publicar, consultar si existen elementos verificables que puedan respaldar esta sección:

- Certificaciones o formación relevante.
- Perfil profesional de Instagram.
- Gimnasios o zonas donde trabaja realmente.
- Testimonios con autorización expresa.
- Fotografías reales de sesiones con autorización de las personas retratadas.

No inventar pruebas sociales. Si no hay testimonios o certificaciones publicables, sostener la confianza con fotografía auténtica, metodología clara, trayectoria aprobada y expectativas transparentes.

## Decisiones implementadas

- Sección `Experience` con seis puntos y copy complementario aprobado.
- La frase absoluta “entrenamiento seguro y eficiente” se presenta como orientación de trabajo, no como garantía.
- Instagram y Mercado Libre se muestran como perfiles públicos secundarios de confianza.
- No se inventaron certificaciones, testimonios, ratings ni resultados de clientes.

---

# 15. Fase 9 — CTA final

## Objetivo

Cerrar la página con una llamada fuerte a la acción.

Contenido:

```text
TU CAMBIO
EMPIEZA HOY.
```

Subtexto:

```text
Contame cuál es tu objetivo y vemos juntos cuál es la mejor manera de empezar.
```

Botón:

```text
HABLAR CON ALEJANDRO
```

Tracking:

```text
source = final_cta
```

## Decisiones implementadas

- Sección `FinalCTA` con copy aprobado y CTA real mediante `WhatsAppButton`.
- Source preservado como `final_cta`.
- Footer con identidad, cobertura, navegación interna e Instagram verificable.
- Diseño estático, responsive y sin JavaScript de cliente.

---

# 16. Fase 10 — Botón flotante WhatsApp

## Requisitos

En mobile debe existir un CTA persistente.

Ejemplo:

```text
Escribime por WhatsApp
```

Debe:

- permanecer visible.
- respetar safe-area de iPhone.
- no tapar contenido.
- ocultarse o adaptarse en footer.
- ser accesible.
- usar tracking.

Tracking:

```text
source = floating_whatsapp
```

## Decisiones implementadas

- CTA persistente únicamente en mobile mediante `FloatingWhatsApp`.
- Source preservado como `floating_whatsapp`.
- Safe area respetada con `env(safe-area-inset-bottom)`.
- Footer con espacio adicional en mobile para evitar que el CTA tape contenido final.
- Enlace real funcional sin JavaScript; tracking reservado para la Fase 12.

---

# 17. Fase 11 — Integración WhatsApp

Centralizar configuración:

```ts
export const WHATSAPP_CONFIG = {
  phone: env.WHATSAPP_PHONE,
  defaultMessage:
    "Hola Alejandro, vi tu página y quería consultarte por entrenamiento personalizado."
}
```

Generar URL correctamente encodeada.

Ejemplo conceptual:

```text
https://wa.me/549XXXXXXXXXX?text=...
```

Nunca hardcodear URLs de WhatsApp en componentes individuales.

## Decisiones implementadas

- Configuración central `WHATSAPP_CONFIG` y generador `getWhatsAppUrl` server-only.
- Número normalizado y validado desde `WHATSAPP_PHONE`.
- Mensaje por defecto codificado con `URLSearchParams`, con soporte para mensajes personalizados.
- Única aparición de `wa.me` en `lib/whatsapp.ts`.
- Todos los CTA usan `WhatsAppButton` y funcionan como enlaces reales sin JavaScript.

---

# 18. Fase 12 — Analytics interno

## Objetivo

Registrar los clicks importantes sin depender exclusivamente de herramientas externas.

Crear tablas en PostgreSQL mediante `migrations/001_create_events.sql`:

```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  event_type text not null check (event_type in ('page_view', 'whatsapp_click')),
  source text not null,
  session_id uuid not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_path text not null,
  created_at timestamptz not null default now(),
  constraint events_source_matches_type check (
    (event_type = 'page_view' and source = 'landing')
    or
    (event_type = 'whatsapp_click' and source in (
      'hero_primary',
      'hero_secondary',
      'floating_whatsapp',
      'final_cta'
    ))
  )
);

create index events_created_at_idx on public.events (created_at);
create index events_session_id_idx on public.events (session_id);
create index events_type_created_at_idx on public.events (event_type, created_at);
create index events_utm_source_created_at_idx on public.events (utm_source, created_at);

```

`client_event_id` se genera en el navegador y permite hacer la inserción idempotente ante reintentos. La API debe tratar un evento repetido como recibido, sin duplicarlo.

`TrackPageView` debe emitir como máximo un `page_view` por carga real del documento. Debe reutilizar el mismo `client_event_id` ante reintentos y evitar duplicados producidos por remounts durante desarrollo.

No exponer credenciales ni acceso directo a la base desde el navegador. La escritura y lectura deben realizarse exclusivamente desde rutas server-side.

No guardar `user_agent` por defecto. Incorporarlo únicamente si existe una necesidad medible, una política de retención y una revisión de privacidad.

Validar en la API longitudes máximas para todos los campos de texto. Definir inicialmente una retención máxima de 12 meses y revisar su necesidad antes de producción.

Evitar almacenar datos personales innecesarios.

## 18.1 Privacidad y medición

Antes del deploy debe documentarse:

- Qué datos se registran y con qué finalidad.
- Tiempo de retención.
- Mecanismo de eliminación.
- Responsable de acceso a Deno Deploy, PostgreSQL y Telegram.
- Necesidad legal de aviso o consentimiento según la implementación final.

Si el navegador expresa `Do Not Track`, no crear identificadores ni registrar eventos internos. Esto nunca debe desactivar ni retrasar los enlaces de WhatsApp.

## 18.2 Estado de implementación

Implementado:

- Migración SQL con constraints, índices e idempotencia por `client_event_id`.
- Runner de migraciones con checksum, transacciones y advisory lock.
- Endpoint `POST /api/events` con validación cerrada, límite de payload y rate limit distribuido en PostgreSQL.
- Acceso a PostgreSQL exclusivamente server-side mediante SQL parametrizado con `pg`.
- Sesiones anónimas con expiración de 30 minutos.
- Captura de los cinco campos UTM al iniciar la sesión.
- Respeto de `Do Not Track` en cliente y servidor.
- `page_view` único por carga y clicks de WhatsApp no bloqueantes con `sendBeacon`/`keepalive`.

Bloqueos para completar la fase:

- Crear la app real de Deno Deploy y adjuntar una base Prisma PostgreSQL.
- Configurar `RATE_LIMIT_SECRET` en los timelines necesarios.
- Aplicar `migrations/001_create_events.sql` con `deno task --tunnel migrate`.
- Verificar inserción, duplicados y errores contra la base real.

La Fase 12 permanece `EN CURSO` hasta resolver estos puntos.

---

# 19. Session ID

Crear un identificador anónimo de sesión.

Guardar en `localStorage` un objeto con:

```text
id
last_activity_at
```

Ejemplo:

```text
landing_session_id
```

Valor:

```text
crypto.randomUUID()
```

Una sesión vence después de 30 minutos de inactividad. Al vencer, generar un UUID nuevo. Actualizar `last_activity_at` cuando se registre una interacción relevante.

El identificador no representa identidad real ni una persona única. Solo permite aproximar sesiones de un navegador y puede perderse, bloquearse o repetirse entre dispositivos.

No denominar a esta métrica “usuarios” o “personas”.

---

# 20. UTM tracking

Al iniciar la sesión, capturar:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Ejemplo:

```text
?utm_source=instagram
&utm_medium=social
&utm_campaign=septiembre
```

Guardar información junto con los eventos.

Capturar la atribución al iniciar una sesión y conservarla durante toda esa sesión. No sobrescribirla al navegar internamente. Normalizar valores vacíos, aplicar límites de longitud y nunca interpretar UTM como HTML.

---

# 21. API de eventos

Crear endpoint:

```text
POST /api/events
```

Payload:

```json
{
  "clientEventId": "uuid",
  "eventType": "whatsapp_click",
  "source": "hero_primary",
  "sessionId": "uuid",
  "landingPath": "/",
  "utm": {
    "source": "instagram",
    "medium": "social",
    "campaign": "septiembre",
    "content": "reel_01",
    "term": null
  }
}
```

## Reglas

- Validar payload.
- No confiar en datos del frontend.
- Manejar errores.
- No exponer claves privadas.
- Logging limitado.
- Aceptar únicamente `page_view` y `whatsapp_click`.
- Aceptar únicamente sources conocidos para cada evento.
- Rechazar campos adicionales y cuerpos excesivos.
- Limitar longitud de path, source y valores UTM.
- Aplicar rate limiting en producción.
- Hacer inserciones idempotentes mediante `clientEventId`.
- Responder rápido; Telegram nunca forma parte de esta petición.

Los datos enviados por el navegador sirven para analítica orientativa, no como evidencia de identidad ni como fuente confiable de seguridad.

Sources iniciales permitidos:

```text
page_view: landing
whatsapp_click: hero_primary | hero_secondary | floating_whatsapp | final_cta
```

---

# 22. Comportamiento del WhatsAppButton

`WhatsAppButton` debe renderizar un enlace real con la URL final en `href`. El destino debe funcionar con JavaScript desactivado.

Orden ideal dentro del gesto del usuario:

```text
CLICK
 ↓
abrir WhatsApp
 + enviar tracking no bloqueante
```

No usar `preventDefault` para esperar analytics. No esperar ninguna respuesta del servidor antes de navegar.

Enviar el evento con `navigator.sendBeacon` cuando sea compatible o `fetch` con `keepalive: true` como alternativa. Un fallo o timeout se ignora desde el punto de vista de navegación.

Si se usa `target="_blank"`, agregar `rel="noopener noreferrer"`. No abrir una ventana después de un `await`, porque el navegador puede bloquearla como popup.

Si tracking falla:

```text
WhatsApp debe abrir igualmente.
```

La intención de contacto tiene prioridad sobre analytics.

---

# 23. Eventos recomendados

Registrar inicialmente:

```text
page_view

whatsapp_click
```

Opcionalmente:

```text
scroll_50
scroll_90
```

Estos eventos son posteriores al MVP analytics. Para incorporarlos debe actualizarse de forma explícita la validación de la API y el constraint de base de datos; no deben enviarse mientras el esquema solo acepte `page_view` y `whatsapp_click`.

No empezar registrando cada mínima interacción.

Mantener analytics simple.

---

# 24. Fase 13 — Telegram

## Objetivo

Recibir estadísticas sin entrar al dashboard.

Crear bot con BotFather.

Variables:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Nunca exponerlas al cliente.

Crear:

```text
lib/telegram.ts
```

---

# 25. Estrategia Telegram

Durante desarrollo se puede probar manualmente el formato:

```text
🔥 Nuevo click de WhatsApp

Origen: Hero
UTM: Instagram
Hora: 18:43
```

No enviar una petición a Telegram por cada evento desde `/api/events`. En producción usar exclusivamente resúmenes agregados para no aumentar la latencia, el ruido ni el acoplamiento del tracking.

Ejemplo:

```text
🏋️ Landing Alejandro Carrizo

Resumen diario

Visitas: 284
Clicks WhatsApp: 37
Tasa de intención de contacto: 13.0%

Origen:
Instagram: 21
Google: 8
Directo: 5
Otros: 3

CTA:
Hero: 16
Flotante: 11
Final: 10
```

---

# 26. Resumen diario

Implementar una ruta segura:

```text
/api/reports/daily
```

Debe:

1. Consultar eventos del día.
2. Calcular:
   - visitas.
   - clicks.
   - sesiones únicas.
   - tasa de intención de contacto.
3. Agrupar por:
   - source.
   - utm_source.
4. Formatear mensaje.
5. Enviar a Telegram.

Los límites del día se calculan en la zona horaria:

```text
America/Argentina/Buenos_Aires
```

No calcular “hoy” usando directamente la fecha UTC del servidor. El endpoint debe ser idempotente para evitar enviar dos veces el mismo resumen diario.

---

# 27. Automatización del resumen

La opción principal es `Deno.cron`.

Ejemplo conceptual:

```text
una vez por día
20:00 Argentina
```

Verificar siempre timezone. `Deno.cron` se configura en UTC: las 20:00 de
`America/Argentina/Buenos_Aires` corresponden actualmente a las 23:00 UTC. Revisar esta conversión
si cambia la plataforma o la normativa horaria.

Antes de implementarlo, validar que el entrypoint generado para Next.js ejecute el registro top-level
de `Deno.cron`. No asumir que una route de Next.js se descubre como cron automáticamente. Si el
adaptador no lo permite, crear un worker Deno separado o usar un endpoint protegido como fallback.

---

# 28. Métricas principales

Priorizar estas métricas:

```text
Sesiones
Clicks WhatsApp
Sesiones con click a WhatsApp
Tasa de intención de contacto
Origen del tráfico
CTA que recibió el click
Campaña UTM
```

Definición inicial:

```text
whatsapp_click_rate =
unique_sessions_with_whatsapp_click
/
unique_sessions
```

Esta métrica representa intención de contacto, no confirma que la persona haya enviado el mensaje, contratado el servicio o alcanzado un resultado comercial.

No usar:

```text
total_clicks / page_views
```

como única métrica, porque un mismo usuario puede hacer varios clicks.

---

# 29. Fase 14 — SEO

Configurar metadata Next.js.

## Title

```text
Alejandro Carrizo | Personal Trainer en Buenos Aires
```

## Description

```text
Entrenamiento personalizado online y presencial en Capital Federal. Mejorá tu fuerza, condición física y salud con un plan adaptado a tus objetivos.
```

Agregar:

- canonical.
- OpenGraph.
- Twitter cards.
- favicon.
- robots.
- sitemap.

---

# 30. OpenGraph

Crear imagen:

```text
1200 x 630
```

Debe incluir:

```text
ALEJANDRO CARRIZO

PERSONAL TRAINER

Entrenamiento personalizado
Online y presencial
```

Mantener estilo visual del sitio.

---

# 31. Structured data

Evaluar JSON-LD para:

```text
Person
```

y/o:

```text
LocalBusiness
```

Solamente incluir información real.

No inventar:

- dirección.
- horario.
- reviews.
- rating.
- precios.

---

# 32. Fase 15 — Imágenes

## Reglas

Guardar en:

```text
/public/images
```

Usar:

```text
next/image
```

Preparar versiones optimizadas.

Evitar imágenes de:

```text
8 MB
10 MB
20 MB
```

Preferir AVIF o WebP cuando sea conveniente.

---

# 33. Fotografías recomendadas

Idealmente conseguir:

1. Retrato principal de Alejandro.
2. Alejandro entrenando.
3. Ejercicio con alumno.
4. Trabajo con pesos.
5. Movimiento funcional.
6. Gimnasio.
7. Foto lifestyle/deportiva.

Evitar stock genérico si existen fotos reales de buena calidad.

---

# 34. Fase 16 — Animaciones

Crear componente reusable:

```text
Reveal
```

Variantes:

```text
fade
fade-up
fade-left
fade-right
```

Duración aproximada:

```text
400–700ms
```

Evitar duraciones largas.

---

# 35. Scroll dinámico

Permitido:

- IntersectionObserver.
- Motion.
- `useScroll`.
- `useTransform`.

Usar efectos especialmente en:

- hero.
- metodología.
- filosofía.
- CTA final.

No animar absolutamente todo.

---

# 36. Reduced motion

Detectar:

```css
@media (prefers-reduced-motion: reduce)
```

Reducir:

- parallax.
- desplazamientos.
- zoom.
- transiciones prolongadas.

---

# 37. Fase 17 — Responsive

Probar al menos:

```text
375 px
390 px
430 px
768 px
1024 px
1280 px
1440 px
```

Controlar:

- títulos.
- saltos de línea.
- botones.
- cards.
- fotografías.
- CTA flotante.
- sticky sections.
- footer.

---

# 38. Fase 18 — Seguridad

Nunca enviar al frontend:

```text
DATABASE_URL
PGPASSWORD
RATE_LIMIT_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Usarlos sólo server-side.

Validar variables de entorno.

Crear:

```text
lib/env.ts
```

Requisitos adicionales:

- Las escrituras a PostgreSQL deben pasar por `/api/events`.
- No importar el pool ni credenciales de base desde Client Components.
- Mantener la base adjunta sin acceso directo desde el navegador.
- Si se usa un endpoint HTTP como fallback para el reporte, protegerlo con un secreto dedicado y comparación segura.
- Aplicar rate limiting al endpoint público de eventos.
- No registrar tokens, secretos ni payloads completos en logs.

---

# 39. Variables de entorno

Ejemplo:

```env
SITE_URL=
DATABASE_URL=
RATE_LIMIT_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

WHATSAPP_PHONE=
```

No se requieren variables `NEXT_PUBLIC_` inicialmente. El Server Component o layout puede leer `SITE_URL` y `WHATSAPP_PHONE`, construir los valores públicos necesarios y pasarlos como props. PostgreSQL se utiliza exclusivamente server-side. Deno Deploy inyecta `DATABASE_URL` y las variables `PG*` al adjuntar la base; localmente deben obtenerse mediante `deno task --tunnel ...` en lugar de copiar credenciales administradas.

---

# 40. Fase 19 — Testing

## Manual

Probar:

- Android.
- iPhone.
- Chrome.
- Safari.
- Firefox.
- Desktop.

---

## Funcional

Verificar:

```text
Hero CTA → WhatsApp

Floating CTA → WhatsApp

Final CTA → WhatsApp

Evento registrado

source correcto

UTM correcto

session correcto
```

## Automatizado

Agregar pruebas para el camino crítico:

- Generación y encoding de la URL de WhatsApp.
- Renovación de sesión después de 30 minutos de inactividad.
- Captura y persistencia de los cinco campos UTM.
- Validación y rechazo de payloads inválidos en `/api/events`.
- Idempotencia mediante `clientEventId`.
- Agregación diaria usando `America/Argentina/Buenos_Aires`.
- Apertura del enlace de WhatsApp aunque `/api/events` falle.

Priorizar pocas pruebas de alto valor. No es obligatorio crear tests unitarios para componentes puramente visuales.

---

# 41. Errores de tracking

Simular:

- PostgreSQL no disponible.
- timeout.
- error 500.
- usuario sin conexión.

En todos los casos:

```text
WhatsApp debe seguir abriendo.
```

---

# 42. Telegram

Verificar:

- token inválido.
- chat ID inválido.
- error API.
- timeout.

No romper el flujo de analytics.

---

# 43. Fase 20 — Deploy

Deploy elegido:

```text
Deno Deploy
```

## Checklist

### MVP público

- Variables de entorno.
- Dominio.
- HTTPS.
- robots.txt.
- sitemap.xml.
- favicon.
- OG image.
- WhatsApp real verificado.
- Lighthouse.
- Sin placeholders visibles.

### MVP analytics

- Prisma PostgreSQL de producción adjunto.
- Analytics.
- Rate limiting.
- Retención y privacidad documentadas.

### Operación posterior

- Telegram producción.
- Cron de Deno verificado o fallback HTTP protegido.
- Reporte diario idempotente.

---

# 44. Dominio

Usar dominio propio si está disponible.

Ejemplos conceptuales:

```text
alejandrocarrizo.com.ar
alejandrocarrizo.fit
alejandrocarrizo.com
```

No registrar ninguno automáticamente.

---

# 45. Git workflow

Usar commits chicos.

Ejemplos:

```text
chore: initialize next project

feat: add design system

feat: build hero section

feat: add training goals section

feat: implement whatsapp tracking

feat: integrate postgres events

feat: add telegram reports

feat: add seo metadata

fix: improve mobile hero layout

perf: optimize landing images
```

---

# 46. Orden recomendado de implementación

Seguir este orden:

```text
01 decisiones, contenido y assets
02 setup y Git
03 design system
04 hero
05 value proposition
06 goals
07 training modes
08 methodology
09 philosophy
10 experience
11 final CTA y footer
12 responsive
13 accessibility
14 integración WhatsApp
15 SEO
16 animations
17 performance
18 testing del camino crítico público
19 deploy del MVP público
20 PostgreSQL y analytics API
21 UTM, sesiones y testing analytics
22 validación de datos reales
23 Telegram
24 daily report
```

No desarrollar Telegram antes de tener la landing funcionando.

No desarrollar reporting complejo antes de comprobar que los eventos se guardan correctamente.

La publicación del MVP público no debe quedar bloqueada por Telegram ni por el reporte diario.

---

# 47. Contenido principal

## Alejandro

```text
Alejandro Carrizo
Personal Trainer
```

---

## Presentación

```text
Entrenador personal con 8 años de experiencia ayudando a personas a mejorar su condición física y salud.
```

---

## Servicio

```text
Clases personalizadas online o presenciales en diferentes barrios de Capital Federal.
```

---

## Gimnasios

```text
Puedo acompañarte a un gimnasio que te resulte cómodo y conveniente.
```

---

## Domicilio

```text
También podemos entrenar en tu domicilio siempre que cuentes con elementos básicos de entrenamiento.
```

---

## Enfoque

```text
Mi enfoque principal es mejorar tu rendimiento físico y tu salud a lo largo del tiempo.

Busco que mes a mes puedas ver mejoras, siempre con una progresión de menos a más y enseñando la correcta ejecución de los ejercicios para lograr un entrenamiento eficiente y seguro.
```

---

## Filosofía

```text
Entrenar no es solamente verse bien.

Entrenar es salud.

El entrenamiento ayuda a mejorar la calidad de vida y prepara a tu cuerpo para afrontar mejor distintas situaciones de la vida diaria.
```

---

## Objetivos

```text
Si buscás mejorar tu salud, bajar porcentaje de grasa, tonificar o ganar masa muscular, podemos trabajar juntos para lograr esos cambios.
```

---

## Formación

```text
Apasionado por el mundo del entrenamiento y la salud, con capacitación constante y aprendizaje continuo.
```

---

# 48. Copywriting

El agente puede mejorar microcopy, pero debe respetar estas reglas:

- Español de Argentina.
- Usar "vos".
- Tono profesional.
- Cercano.
- Motivador sin exageraciones.
- Evitar promesas médicas.
- Evitar prometer resultados garantizados.
- Evitar lenguaje agresivo de venta.

No usar frases como:

```text
Transformación garantizada
Resultados garantizados
Bajá 10 kg
Cambios asegurados
```

Preferir:

```text
Trabajemos juntos en tus objetivos.
```

---

# 49. WhatsApp copy

Mensaje inicial sugerido:

```text
Hola Alejandro, vi tu página y quería consultarte por entrenamiento personalizado.
```

Posible versión dinámica:

```text
Hola Alejandro, vi tu página y quería consultarte por entrenamiento personalizado. Mi objetivo es:
```

No precompletar información sensible.

---

# 50. Componentes obligatorios

Antes de finalizar, deben existir como mínimo:

```text
Hero
ValueProposition
Goals
TrainingModes
Method
Philosophy
Experience
FinalCTA
Footer
WhatsAppButton
Reveal
```

---

# 51. Criterios de calidad

Una sección está terminada solamente cuando:

- funciona desktop.
- funciona mobile.
- no rompe layout.
- tiene buena jerarquía visual.
- cumple accesibilidad básica.
- funciona sin JS innecesario.
- no introduce warnings.
- no afecta Lighthouse severamente.

---

# 52. Reglas para el agente de OpenCode

## Regla 1

Antes de modificar archivos:

1. inspeccionar estructura existente.
2. revisar package.json.
3. revisar componentes relacionados.
4. evitar duplicar funcionalidad.

---

## Regla 2

No crear dependencias nuevas si una solución simple ya existe.

Antes de instalar una librería:

- justificar necesidad.
- verificar que no exista alternativa nativa.

---

## Regla 3

No refactorizar código que no tenga relación con la tarea actual salvo que sea necesario.

---

## Regla 4

Mantener:

```text
TypeScript strict
```

Evitar:

```ts
any
```

salvo caso explícitamente justificado.

---

## Regla 5

Usar Server Components por defecto.

Agregar:

```ts
"use client";
```

sólo cuando sea necesario para:

- interacción.
- hooks.
- Motion.
- acceso al navegador.

---

## Regla 6

Separar lógica del UI.

Ejemplo:

```text
WhatsAppButton
     ↓
analytics.ts
     ↓
/api/events
```

No poner toda la lógica dentro del botón.

---

## Regla 7

Nunca hardcodear secrets.

---

## Regla 8

Cada fase debe cerrar con:

```bash
npm run lint
npm run build
```

Resolver errores antes de continuar.

---

# 53. Flujo de trabajo por tarea

Para cada tarea:

## Paso 1

Analizar archivos relacionados.

## Paso 2

Explicar brevemente qué se va a cambiar.

## Paso 3

Implementar.

## Paso 4

Ejecutar:

```bash
npm run lint
```

## Paso 5

Ejecutar:

```bash
npm run build
```

## Paso 6

Corregir errores.

## Paso 7

Resumir:

- archivos modificados.
- funcionalidad creada.
- decisiones relevantes.
- próximos pasos.

---

# 54. Definición de MVP

## 54.1 MVP público

La primera versión publicable incluye:

- Landing completa.
- Responsive.
- Hero.
- Servicios.
- Objetivos.
- Modalidades.
- Método.
- Filosofía.
- Experiencia.
- CTA final.
- WhatsApp funcionando.
- SEO.
- Accesibilidad y navegación por teclado.
- Lighthouse dentro de los objetivos sobre el build de producción.
- Monitoreo preparado para validar Core Web Vitals cuando exista tráfico real suficiente.
- Deploy en Deno Deploy.

## 54.2 MVP analytics

Se incorpora después de validar el MVP público:

- Tracking de `page_view` y `whatsapp_click`.
- Prisma PostgreSQL funcionando únicamente server-side.
- UTM tracking completo.
- Sesiones anónimas con expiración.
- Rate limiting e idempotencia.
- Política de privacidad y retención documentada.

## 54.3 Operación posterior

No bloquea ninguno de los MVP anteriores:

- Telegram.
- Resumen diario.
- Alertas operativas.

---

# 55. Funcionalidades posteriores al MVP

No implementar antes de terminar el MVP salvo pedido explícito.

Ideas:

```text
Panel de estadísticas

Testimonios

Casos reales

Before / after

Reserva de horarios

Calendario

Formulario

Email marketing

Pixel Meta

Google Analytics

Google Ads conversion tracking

A/B testing

Blog

Rutinas digitales

Planes online pagos
```

Telegram y el resumen diario también son posteriores al MVP público, aunque tengan fases detalladas en este documento.

---

# 56. Posible dashboard futuro

Podría mostrar:

```text
Visitas hoy

Sesiones

Clicks WhatsApp

Tasa de intención de contacto

Clicks por CTA

Origen tráfico

Campañas

Evolución 7 días

Evolución 30 días
```

No forma parte del MVP.

---

# 57. Decisiones que deben consultarse antes de asumir

El agente NO debe inventar:

- número de WhatsApp.
- Instagram.
- precios.
- horarios.
- barrios exactos.
- dirección.
- testimonios.
- certificaciones.
- promociones.
- descuentos.
- resultados de clientes.
- fotos no provistas.
- rating.
- reseñas.

Si falta alguno, usar placeholder claramente marcado.

---

# 58. Checklist final

## Diseño

- [ ] Hero potente.
- [ ] Identidad consistente.
- [ ] Tipografía correcta.
- [ ] Mobile correcto.
- [ ] Desktop correcto.
- [ ] CTA visible.
- [ ] Footer.

## Funcional

- [ ] Enlaces reales de WhatsApp funcionan sin JavaScript.
- [ ] WhatsApp Hero.
- [ ] WhatsApp flotante.
- [ ] WhatsApp final.
- [ ] Navegación a WhatsApp no espera analytics.

## Analytics

- [ ] Tracking.
- [ ] Session ID.
- [ ] UTM.
- [ ] PostgreSQL.
- [ ] Idempotencia.
- [ ] Rate limiting.
- [ ] Retención y privacidad documentadas.

## Operación posterior

- [ ] Telegram.
- [ ] Reporte.

## Técnico

- [ ] TypeScript.
- [ ] ESLint.
- [ ] Build.
- [ ] Secrets protegidos.
- [ ] Imágenes optimizadas.
- [ ] Reduced motion.
- [ ] Metadata.
- [ ] Sitemap.
- [ ] Robots.
- [ ] OG.

## Calidad

- [ ] Chrome.
- [ ] Safari.
- [ ] Mobile.
- [ ] Lighthouse.
- [ ] LCP, CLS e INP dentro de objetivo.
- [ ] Links.
- [ ] Errores API.
- [ ] WhatsApp funciona aunque analytics falle.
- [ ] Pruebas automatizadas del camino crítico.

---

# 59. Primera tarea para el agente

Empezar únicamente por la Fase 0.

Antes de inicializar, revisar la Fase previa 5.1. Informar los insumos faltantes y usar placeholders durante desarrollo sin bloquear el setup. Ningún placeholder puede llegar a producción.

Prompt sugerido:

```text
Usá este documento como especificación principal del proyecto.

Comenzá únicamente por la Fase 0 — Inicialización.

1. Inspeccioná primero el repositorio actual.
2. Revisá los prerrequisitos de la sección 5.1 e informá bloqueantes.
3. No sobrescribas archivos importantes sin revisarlos.
4. Si el proyecto todavía no está inicializado, creá la base con Next.js, TypeScript, App Router y Tailwind.
5. Instalá Motion.
6. Configurá ESLint y Prettier.
7. Creá la estructura inicial de carpetas.
8. Creá .env.example.
9. Creá un README básico.
10. Ejecutá lint y build.
11. Corregí cualquier error.

Al terminar no avances a la Fase 1.

Informame:
- archivos creados.
- archivos modificados.
- dependencias instaladas.
- resultado de lint.
- resultado de build.
- cualquier decisión técnica relevante.
```

---

# 60. Segunda tarea para el agente

Cuando Fase 0 esté aprobada:

```text
Continuá con la Fase 1 — Diseño base.

No avances a la Fase 2.

Implementá:
- tokens visuales.
- colores.
- tipografía.
- spacing.
- container.
- componentes básicos.

Mostrame qué decisiones visuales tomaste antes de cerrar la tarea.

Ejecutá lint y build.
```

---

# 61. Regla de avance

No desarrollar todas las fases en un único prompt.

Trabajar fase por fase:

```text
implementar
↓
revisar
↓
probar
↓
aprobar
↓
siguiente fase
```

Esto evita:

- sobreingeniería.
- inconsistencias.
- código sin revisar.
- decisiones visuales incorrectas.
- bugs acumulados.

---

# 62. Resultado esperado

La landing final debe sentirse:

```text
moderna
premium
deportiva
humana
profesional
rápida
simple de usar
orientada a conversión
```

No debe sentirse como:

```text
template genérico
gimnasio agresivo
sitio saturado
landing llena de efectos
```

La experiencia principal debe ser:

```text
ver
↓
entender
↓
confiar
↓
contactar
```
