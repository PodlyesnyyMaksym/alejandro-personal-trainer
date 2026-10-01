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
2. Definir las variables de la app en Deno Deploy:
   - `WHATSAPP_PHONE`: requerida en build; sin ella el prerender de `/` falla y el deploy no compila.
   - `RATE_LIMIT_SECRET`: valor aleatorio de al menos 32 caracteres.
3. La app de Deno tiene configurado el pre-deploy con Deno sobre scripts standalone (ver debajo).
   Mantenerlo en Settings → App Config → Edit. El `deno.json` mínimo sigue siendo el del tunnel
   local: su parser 2.6.9 rechaza campos de build. Se probó la selección de `deno.jsonc` en un
   upload manual, pero no aseguró las migraciones; por eso se usa configuración de la app,
   verificada mediante el mismo procedimiento de guardado del dashboard.
4. Aplicar la migración al timeline local con `deno task --tunnel migrate`. El pre-deploy la aplica
   en Producción. Los logs del proveedor confirman que Preview omite pre-deploy en este entorno.
5. Verificar inserciones e idempotencia mediante `POST /api/events` antes de habilitar analytics en
   producción.

No se debe completar `DATABASE_URL` manualmente al usar el tunnel. Para una base PostgreSQL externa
o un entorno sin tunnel, sí se puede definir localmente junto con `RATE_LIMIT_SECRET`.

Los enlaces de WhatsApp siguen funcionando aunque analytics no esté configurado.

### Robustez y comprobación del esquema

`npm run test` ejecuta pruebas offline del cliente, API y migraciones. `deno task check`
incluye estas pruebas, formato, lint y build. Para comprobar el catálogo y ledger de la base
sin modificar datos, ejecutar `deno task --tunnel db:verify`. No basta con un checksum:
este comando compara columnas, constraints e índices y falla ante diferencias o migraciones pendientes.

Por defecto el rate limit utiliza un bucket compartido conservador. Configurar
`ANALYTICS_TRUSTED_IP_HEADER` como `x-real-ip` o `x-forwarded-for` únicamente tras verificar
que el ingress sobrescribe ese header con una sola IP verificada. Listas o IPs inválidas
usan el bucket compartido. Sin esa garantía no habilitar confianza en headers del cliente.
El límite es de 30 peticiones por ventana fija de minuto, no por ventana móvil;
usa el reloj de PostgreSQL. El bucket compartido puede limitar colectivamente el tráfico.

TLS se conserva según las variables del proveedor; comprobarlo por entorno sin desactivar
la validación de certificados. Las migraciones requieren conexión con afinidad de sesión
para su advisory lock. Estas garantías de infraestructura requieren validación en Deno.

## Deploy

### Formulario voluntario de contacto

El formulario guarda nombre y teléfono exclusivamente en `public.contacts`, separado de analytics.
No identifica a quienes solo hacen clic en WhatsApp. El envío exige una aceptación explícita del
aviso `contact-v1`, guarda su versión y fecha, y no habilita publicidad. DNT no impide enviar una
consulta voluntaria. WhatsApp permanece disponible sin completar el formulario y sin JavaScript.

Está deshabilitado por defecto. Antes de habilitarlo:

1. El dueño del proyecto confirmó que es responsable y decidió conservación sin plazo fijo,
   hasta eliminación a su criterio o solicitada por WhatsApp. Esta condición aparece en el aviso;
   no modifica la retención de analytics. Siguen pendientes la revisión legal, identificación pública
   completa del responsable y procedimientos de eliminación incluyendo backups y acceso restringido.
2. Aplicar `002_create_contacts.sql` mediante el runner existente y ejecutar `db:verify`.
3. Definir `CONTACT_FORM_ENABLED=true` en el build y runtime de Deno y reconstruir la landing;
   la visibilidad se prerenderiza. En local usar el entorno adecuado sin copiar credenciales administradas.
4. Definir `CONTACT_FORM_ALLOWED_ORIGINS` con los orígenes HTTPS públicos permitidos, separados
   por comas y sin paths. El proxy de Deno presenta una URL interna a Next.js; no confiar en
   forwarding headers para este control. Sin lista se exige coincidencia con la URL directa
   (desarrollo local). Cada Preview nuevo necesita su origen explícito si debe recibir formularios.
   El endpoint usa un bucket de rate limit separado de analytics.

El usuario autorizó la activación en Deno y la variable se configuró a `true` para todos los
contextos el 2026-09-30. La configuración local por defecto sigue siendo opt-in.

Los reintentos del mismo envío conservan un UUID en memoria para evitar duplicados. No se guardan
teléfonos en UTM, URLs, localStorage, logs ni eventos. No hay panel ni endpoint público de lectura
de contactos y tampoco notificaciones automáticas: revisar la base requiere acceso autorizado.

El destino es Deno Deploy con integración de GitHub y el preset de Next.js. La app usa estos
timelines:

- Producción: `{app-id}-production`.
- Branch: `{app-id}--{branch-name}`.
- Preview: `{app-id}-preview`.

La migración debe ejecutarse contra la base adjunta antes de promover una release que dependa de un
cambio de esquema.

Cada timeline recibe su propia base lógica, creada durante el primer deploy exitoso de ese timeline.
Hasta entonces `DATABASE_URL` no existe y la API responde `503` sin romper el resto de la landing.

Deploy manual a producción con migración y verificación previas al routing:

```bash
deno deploy --org atenon --app alejandro-personal-trainer --prod
```

Confirmar pre-deploy en la app y el resultado de migración por timeline; routing exitoso
por sí solo no demuestra inserción funcional. No agregar un archivo de source config que
anule accidentalmente los ajustes de la app. La integración automática de GitHub sigue pendiente.

El pre-deploy no tiene `npm`. Se usa `deno run -A --no-config --node-modules-dir=manual`
sobre `.next/standalone/scripts/migrate.mjs`, después `verify-database.mjs` y finalmente
`cleanup-contact-probe.mjs`, unidos con `&&`. Next incluye esos scripts y sus dependencias en
el artefacto standalone mediante tracing. La limpieza solo elimina la prueba reservada de deploy
si coinciden simultáneamente UUID, nombre de prueba y teléfono sintético; no elimina contactos reales.

Producción es el destino para consultas reales. Preview conserva una base aislada y no ejecuta
pre-deploy aquí; no asumir que su formulario puede recibir contactos sin migrar esa base por una
ruta soportada. Tampoco basta agregar su dominio a la allowlist.

Release verificada el 2026-09-30: `1khzn58fcy2j`, publicada en
`https://alejandro-personal-trainer.atenon.deno.net`. Pre-deploy confirmó esquema y ledger correctos;
un envío sintético y su reintento fueron aceptados en Producción y su única fila se eliminó después.
La allowlist actual admite exclusivamente ese origen de Producción.
