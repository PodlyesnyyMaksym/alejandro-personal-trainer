# Alejandro Carrizo Personal Trainer

Landing page para el servicio de entrenamiento personal de Alejandro Carrizo.

La especificación funcional y el seguimiento de fases están en
`PLAN_DESARROLLO_LANDING_ALEJANDRO.md`.

## Requisitos

- Node.js 20.9 o superior.
- npm 10 o superior.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Verificación

```bash
npm run lint
npm run build
```

## Variables de entorno

Copiar los nombres requeridos desde `.env.example` a `.env.local` y completar únicamente los
valores necesarios para la fase activa. Nunca versionar `.env.local`.

## Analytics interno

La implementación está preparada, pero requiere un proyecto real de Supabase:

1. Aplicar `supabase/migrations/001_create_events.sql`.
2. Configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.
3. Verificar inserciones mediante `POST /api/events` antes de habilitar analytics en producción.

Los enlaces de WhatsApp siguen funcionando aunque analytics no esté configurado.
