# Dashboard Personal Study Project

Este repositorio es un proyecto de estudio y aprendizaje para construir una API del dashboard local inspirada en `homarr`. El objetivo es experimentar con:

- Arquitectura monorepo con `pnpm` y paquetes compartidos
- Integraciones externas normalizadas en TypeScript
- Validación de respuestas con Zod
- API real con `tRPC` y Fastify
- Agrupación de datos por integración y manejo de fallos parciales

## Enfoque

El proyecto no está pensado como un producto final, sino como una reimplementación personal de patrones útiles de Homarr:

- Clase por servicio externo
- Normalización de datos comunes
- Inyecciones de dependencias estáticas al arranque
- Routers organizados por capacidad (`calendar`, etc.)
- Validación temprana y contratos claros

## Estado actual

- Workspace `pnpm` configurado con `apps/server`, `packages/common`, `packages/integrations`, `packages/definitions` y `apps/clients/*`
- `@dashboard/server` expone un router tRPC con:
  - `health`
  - `calendar.getEvents`
- `@dashboard/integrations` contiene:
  - Sonarr integration
  - Zod schemas para el calendario de Sonarr
- `@dashboard/definitions` contiene:
  - definiciones de servicios externos
  - iconos generados para la UI (kind -> icon)
- `apps/clients/react` contiene:
  - el scaffold del dashboard
  - el scaffold de sections para mostrar las integraciones (calender -> sonarr)
  - mock data para la visualización y validación de la UI y el Schema tipado.
- Se usa `superjson` en tRPC para transporte de datos
- Se valida la respuesta de Sonarr antes de mapearla al contrato de calendario

## Estructura

- [`apps/server/`](apps/server/README.md)
  - `src/config.ts`
  - `src/bootstrap/integrations.ts`
  - `src/trpc.ts`
  - `src/routers/calendar.ts`
  - `src/index.ts`
- [`apps/clients/*`](apps/clients/README.md)
  - [`apps/clients/react/`](apps/clients/react/README.md)
    - `mantine` como base de componentes, temas y paletas.
- `packages/common/`
  - helpers sin dominio utilizados por el `apps/server/` o `packages/integrations/`
- `packages/integrations/`
  - base de integraciones y contratos
  - Sonarr integration
- `packages/definitions/`
  - catálogos del dominio (kind → nombre, ícono). Lo consumen `integrations` y los clientes
  - generación de assets a partir de `.svg` como data `URIs` embed en un `.ts` local sin dependencia del bundler o de una CDN

## Próximos pasos

- Extender el catálogo multimedia y enlaces externos
- Evaluar episodios faltantes, cola, estado y búsqueda.
- Probar múltiples instancias de una misma integración.
- Añadir pruebas automatizadas de contratos y errores.
- Evaluar caché y jobs en una etapa posterior.
- Prototipar el contrato de la integration de Radarr.
- Actualizar y extender `.env.example` en `apps/server/`

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
pnpm lint
pnpm format
```

## Notas

El proyecto está inspirado en Homarr, pero está diseñado como un backend y frontend de uso personal y experimental, no como una plataforma multiusuario ni una réplica completa.

> El "frontend" se planea multiples paquetes con React, Vue, Svelte entre otros (sin cerrar de forma completa.)
