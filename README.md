# Dashboard Personal Study Project

Este repositorio es un proyecto de estudio y aprendizaje para construir una API de dashboard local inspirada en `homarr`. El objetivo es experimentar con:

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

- Workspace `pnpm` configurado con `apps/server`, `packages/common` y `packages/integrations`
- `@dashboard/server` expone un router tRPC con:
  - `health`
  - `calendar.getEvents`
- `@dashboard/integrations` contiene:
  - Sonarr integration
  - Zod schemas para el calendario de Sonarr
- Se usa `superjson` en tRPC para transporte de datos
- Se valida la respuesta de Sonarr antes de mapearla al contrato de calendario

## Estructura

- `apps/server/`
  - `src/config.ts`
  - `src/bootstrap/integrations.ts`
  - `src/trpc.ts`
  - `src/routers/calendar.ts`
  - `src/index.ts`
- `packages/common/`
  - helpers compartidos
- `packages/integrations/`
  - base de integraciones y contratos
  - Sonarr integration

## Próximos pasos

- Definir el contrato de catálogo y series.
- Evaluar episodios faltantes, cola, estado y búsqueda.
- Probar múltiples instancias de una misma integración.
- Añadir pruebas automatizadas de contratos y errores.
- Evaluar caché y jobs en una etapa posterior.

## Desarrollo

```bash
pnpm install
pnpm typecheck
pnpm --filter @dashboard/server dev
```

## Notas

El proyecto está inspirado en Homarr, pero está diseñado como un backend de uso personal y experimental, no como una plataforma multiusuario ni una réplica completa.