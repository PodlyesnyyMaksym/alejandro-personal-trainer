# Alejandro Carrizo Personal Trainer

Landing page para el servicio de entrenamiento personal de Alejandro Carrizo.

La especificación funcional y el seguimiento de fases están en
`PLAN_DESARROLLO_LANDING_ALEJANDRO.md`.

## Requisitos

- Node.js 20.9 o superior.
- npm 10 o superior.
- Deno 2.6.9 o superior para trabajar con recursos de Deno Deploy mediante tunnel.

## Desarrollo

```bash
npm install
deno task --tunnel dev
```

Abrir `http://localhost:3000`.

Para trabajar solamente sobre la interfaz, sin analytics remoto, también se puede usar `npm run dev`.

## Verificación

```bash
deno task check
```

## Variables de entorno

Copiar los nombres requeridos desde `.env.example` a `.env.local` y completar únicamente los
valores necesarios para la fase activa. Nunca versionar `.env.local`.

## Analytics interno

La API usa PostgreSQL exclusivamente desde el servidor, sin credenciales de base de datos en el
navegador. Deno Deploy inyecta `DATABASE_URL` y las variables `PG*` al adjuntar una base Prisma
PostgreSQL.

1. Crear la app en `console.deno.com` y adjuntar una base Prisma PostgreSQL.
2. Configurar `RATE_LIMIT_SECRET` con un valor aleatorio de al menos 32 caracteres en cada timeline.
3. Ejecutar `deno task --tunnel migrate` para aplicar los archivos de `migrations/`.
4. Verificar inserciones e idempotencia mediante `POST /api/events` antes de habilitar analytics en
   producción.

No se debe completar `DATABASE_URL` manualmente al usar el tunnel. Para una base PostgreSQL externa
o un entorno sin tunnel, sí se puede definir localmente junto con `RATE_LIMIT_SECRET`.

Los enlaces de WhatsApp siguen funcionando aunque analytics no esté configurado.

## Deploy

El destino es Deno Deploy con integración de GitHub y el preset de Next.js. La app usa estos
timelines:

- Producción: `{app-id}-production`.
- Branch: `{app-id}--{branch-name}`.
- Preview: `{app-id}-preview`.

La migración debe ejecutarse contra la base adjunta antes de promover una release que dependa de un
cambio de esquema.
