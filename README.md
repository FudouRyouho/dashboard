# Dashboard Personal Study Project

Este repositorio es un proyecto de estudio y aprendizaje para construir una API del dashboard local inspirada en `homarr`. El objetivo es experimentar con:

- Arquitectura monorepo con `pnpm` y paquetes compartidos
- Integraciones externas normalizadas en TypeScript
- Validación de respuestas con Zod
- API real con `tRPC` y Fastify
- Tareas programadas en segundo plano, desacopladas de las request
- Agrupación de datos por integración y manejo de fallos parciales

## Enfoque

El proyecto no está pensado como un producto final, sino como una reimplementación personal de patrones útiles de Homarr:

- Clase por servicio externo
- Normalización de datos comunes
- Inyecciones de dependencias estáticas al arranque
- Routers organizados por capacidad (`calendar`, etc.)
- Validación temprana y contratos claros
- Tareas programadas con ultimo dato conocido, separando el concepto del **estado de la tarea** y el **estado del dato**

## Estado actual

- Workspace `pnpm` con `apps/server`, `apps/clients/*` y cinco paquetes: `common`, `contracts`, `definitions`, `integrations` y `tasks`
- `@dashboard/contracts` es la base: schemas de Zod y tipos que cruzan el límite servidor ↔ cliente. No depende de ningún otro paquete del workspace
- `@dashboard/server` expone un router tRPC con:
  - `health`
  - `calendar.getEvents` — devuelve el último snapshot en memoria más el estado de la última corrida; ya no llama a la integración dentro del request
- `@dashboard/tasks` es el motor de tareas programadas: timers, techo de concurrencia, cancelación y cooldown tras fallos seguidos
- `@dashboard/integrations` contiene:
  - Sonarr y Radarr integration
  - Zod schemas del calendario de cada una
  - clasificación de errores a un motivo estable (`unauthorized`, `unreachable`, `timeout`, `invalid-response`, `unknown`)
- `@dashboard/definitions` contiene:
  - definiciones de servicios externos
  - iconos generados para la UI (kind -> icon)
- `apps/clients/react` contiene:
  - el scaffold del dashboard y de las sections
  - mock data para la visualización y validación de la UI y el Schema tipado
  - un piloto desechable que ya consume `/trpc` real y muestra el estado del dato
- Se usa `superjson` en tRPC para transporte de datos
- Se valida la respuesta de la integración antes de mapearla al contrato de calendario
- Hay tests con `node:test` en `packages/contracts`, `packages/tasks` y `apps/server`

## Estructura

- [`apps/server/`](apps/server/README.md)
  - `src/config.ts` — configuración validada con Zod al arranque
  - `src/bootstrap/integrations.ts` — instancia una integración por entrada de config
  - `src/tasks/` — qué tarea se arma para cada integración y cómo se lee su resultado
  - `src/trpc.ts`
  - `src/routers/calendar.ts`
  - `src/index.ts`
- [`apps/clients/*`](apps/clients/README.md)
  - [`apps/clients/react/`](apps/clients/react/README.md)
    - `mantine` como base de componentes, temas y paletas.
- [`packages/contracts/`](packages/contracts/README.md)
  - la forma de los datos: calendario, `ResultStatus`, kinds
  - lectura derivada del estado (`dataViewOf`, `inRange`)
- [`packages/tasks/`](packages/tasks/README.md)
  - motor de tareas programadas, sin dominio: no sabe qué es una integración
  - almacén de snapshots y bitácora de corridas
- [`packages/integrations/`](packages/integrations/README.md)
  - base de integraciones y capacidades
  - Sonarr y Radarr integration
- [`packages/definitions/`](packages/definitions/README.md)
  - catálogos del dominio (kind → nombre, ícono). Lo consumen `integrations` y los clientes
  - generación de assets a partir de `.svg` como data `URIs` embed en un `.ts` local sin dependencia del bundler o de una CDN
- `packages/common/`
  - helpers sin dominio utilizados por el `apps/server/` o `packages/integrations/`

## Próximos pasos

- [x] Extender el catálogo multimedia y enlaces externos
- [ ] Evaluar episodios faltantes, cola, estado y búsqueda.
- [ ] Probar múltiples instancias de una misma integración.
- [ ] Añadir pruebas automatizadas de contratos y errores.
- [ ] Evaluar caché y jobs en una etapa posterior.
- [x] Prototipar el contrato de la integration de Radarr.
- [x] Actualizar y extender `.env.example` en `apps/server/`
- [ ] Extender los tests de contrato y de errores.

## Cruce de dependencias

    contracts   ←  definitions, integrations, tasks(*), server, client-react
    common      ←  integrations, server
    tasks       ←  server
    definitions ←  client-react

## Desarrollo

> [!TIP]
> usar --filter @dashboard/{package-name} para instalar paquetes standalone:

```bash
pnpm add <pkg> --filter <workspace> # Ejemplo: `pnpm add react-dom --filter @dashboard/client-react`
```

> [!CAUTION]
> `apps/server/.env` es necesario para inicializar el servidor, utilizar `apps/server/.env.example` como base.

> [!IMPORTANT]
> el monorepo resuelve los paquetes de forma automática con pnpm en el workspace, utilizar los comandos a continuación para cada paquete.

### `apps/server/`

```bash
pnpm --filter @dashboard/server dev
pnpm --filter @dashboard/server smoke   # smoke test del contrato de punta a punta

```

### `apps/clients/react`

```bash
pnpm --filter @dashboard/client-react lint # eslint configurado para react-ts extendiendo la configuración raíz (eslint.config.mjs)
pnpm --filter @dashboard/client-react dev
```

### `packages/definitions`

```bash
pnpm --filter @dashboard/definitions build:icons
```

> [!NOTE]
> install en la raíz para todos los paquetes, `typecheck` está configurado excluyendo `apps/clients/**`, el cliente tiene el suyo propio.

```bash
pnpm install
pnpm typecheck
pnpm test          # node:test sobre packages/*/src/**/*.test.ts y apps/server/src/**/*.test.ts
pnpm lint
pnpm format
pnpm format:check
```

> [!WARNING]
> `pnpm test` barre también `apps/server/src/trpc-client.test.ts` y
> `apps/server/src/scripts/trpc-error-smoke.test.ts`, que se llaman `.test.ts`
> pero necesitan el server levantado. Sin `dev` corriendo, esos dos fallan.

## Notas

El proyecto está inspirado en Homarr, pero está diseñado como un backend y frontend de uso personal y experimental, no como una plataforma multiusuario ni una réplica completa.

> El "frontend" se planea multiples paquetes con React, Vue, Svelte entre otros (sin cerrar de forma completa.)
