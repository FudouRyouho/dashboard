# Estándares y Guías de Testing

Este documento describe las convenciones, patrones e infraestructura de testing para el monorepo del dashboard.

## Visión General

El repositorio utiliza **Vitest** como test runner con soporte TypeScript nativo y reporte de cobertura con v8.

- **Framework de Testing**: Vitest `^3.0.0`
- **Proveedor de Cobertura**: `@vitest/coverage-v8`
- **Configuración del Runner**: Modo single-thread mediante configuración de worker pool para mantener bajo overhead de memoria (~50-100MB por ejecución) y prevenir fugas de memoria.

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm test` | Ejecuta todas las pruebas unitarias una vez en todos los paquetes y apps |
| `pnpm test:coverage` | Ejecuta todas las pruebas con reporte de cobertura v8 y verificación de umbrales |
| `pnpm test:watch` | Ejecuta pruebas en modo interactivo watch |
| `pnpm typecheck` | Verifica tipos TypeScript en todo el monorepo sin generar JS |

---

## Organización y Nomenclatura de Pruebas

1. **Ubicación**: Ubica archivos de prueba junto a los archivos fuente con extensión `.test.ts` (ej: `packages/common/src/url.ts` → `packages/common/src/url.test.ts`).
2. **Idioma**: Escribe descripciones de prueba, bloques `describe` y aserciones en **inglés** para consistencia a lo largo del código base.
3. **Estructura**: Utiliza los bloques estándar `describe` y `test`/`it` proporcionados por Vitest:

```ts
import { describe, test, expect } from 'vitest';
import { removeTrailingSlash } from './url.js';

describe('removeTrailingSlash', () => {
  test('removes trailing slash from URL', () => {
    expect(removeTrailingSlash('http://example.com/')).toBe('http://example.com');
  });
});
```

---

## Patrones de Testing y Buenas Prácticas

### 1. Testing de Base de Datos (`@dashboard/db` & `@dashboard/tasks`)

- Utiliza archivos SQLite temporales mediante `randomUUID()` dentro de un helper `withTempDb` o un hook `afterEach` para asegurar pruebas aisladas y repetibles.
- Siempre limpia los archivos SQLite temporales en `finally` o `afterEach`.

```ts
import { test, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';

const tempPath = `./data/test-${randomUUID()}.sqlite`;

afterEach(() => {
  try {
    unlinkSync(tempPath);
  } catch {}
});
```

### 2. Testing de Integración HTTP (`@dashboard/integrations`)

- Mockea `global.fetch` en pruebas de integración en lugar de hacer llamadas a endpoints reales.
- Guarda `global.fetch` original antes de las pruebas y restauralo en un bloque `finally` o `afterEach`.
- No hagas requests de red externos en pruebas unitarias/integración estándar.

```ts
test('SonarrIntegration fetches calendar', async () => {
  const previousFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify([]));

  try {
    // Perform test
  } finally {
    global.fetch = previousFetch;
  }
});
```

---

## Pruebas de Red y E2E (Excluidas de CI)

Las siguientes suites de pruebas requieren un servidor backend en ejecución o infraestructura externa y están excluidas de la ejecución estándar de `pnpm test`:

- `apps/server/src/server.e2e.test.ts`
- `apps/server/src/trpc-client.test.ts`
- `apps/server/src/bootstrap/persistence-e2e.test.ts`
- `apps/server/src/scripts/trpc-error-smoke.test.ts`
- `packages/integrations/src/prometheus/prometheus.e2e.test.ts`

Para ejecutar pruebas de red/E2E localmente contra instancias reales:
```bash
INTEGRATIONS_SERVER_E2E=1 pnpm test apps/server/src/server.e2e.test.ts
```

---

## Matriz de Inventario de Pruebas

La siguiente tabla resume la cobertura de pruebas por módulo, indicando qué pruebas existen, qué falta y prioridad de implementación.

| Paquete / Módulo | Archivo(s) | Tipo de Prueba Requerida | Estado Actual | Prioridad / Notas |
| :--- | :--- | :--- | :--- | :--- |
| **`@dashboard/common`** | `url.ts`, `date.ts`, `error.ts`, `string.ts` | Pure unit | ✅ Implemented (100%) | Stable foundation |
| **`@dashboard/contracts`** | Zod schemas (`validation.ts`, `data-view.ts`, `result.ts`, etc.) | Unit (valid/invalid) | ✅ Implemented (~75%) | Focus on improving schema validation coverage |
| **`@dashboard/db`** | Connection, migrations, queries (`task-runs.ts`, `task-snapshots.ts`, `integrations.ts`, etc.) | SQLite integration | ✅ Implemented (~90%) | Excellent isolation with `withTempDb` helper |
| **`@dashboard/definitions`** | Enums (`IntegrationKind.ts`, `WidgetKind.ts`) | Unit (type safety) | ⚠️ Pending (0%) | Low risk – pure TypeScript enums/constants |
| **`@dashboard/integrations`** | Base class, error mapping (`integration.ts`, `integration-error.ts`) | Unit with fetch mocks | ✅ Implemented (~60%) | Core error classification solid; needs more unit coverage |
| **`@dashboard/integrations`** | Specific clients (Prometheus, qBittorrent, Docker, Jellyfin, Sonarr, Radarr) | HTTP mocks + schemas | ⚠️ Partial (varied) | Prometheus & qBittorrent: medium; Docker/Jellyfin/Sonarr/Radarr: low |
| **`@dashboard/tasks`** | Scheduler, run-log, store, purge (`scheduler.ts`, `run-log.ts`, `store.ts`, `purge.ts`) | SQLite integration + async | ✅ Implemented (~95%) | Strong coverage in task lifecycle and persistence |
| **`apps/server`** | tRPC routers (`calendar.ts`, `downloads.ts`, `integrations.ts`, `media-releases.ts`, etc.) | tRPC integration / Mock DB | ⚠️ Pending (0%) | **Critical**: Needs tests covering error paths and integration failure handling |
| **`apps/server`** | Docker router (`docker.ts`) | tRPC integration / Mock DB | ⚠️ Pending (0%) | **New**: Docker router added in Phase 2 — no tests yet; needs `getContainers` query and `startAll`/`stopAll`/`restartAll`/`removeAll` mutation coverage |
| **`apps/server`** | Server bootstrapping (`server.ts`, `main.ts`, `config.ts`) | Startup / smoke | ⚠️ Pending (0%) | Low priority for unit; validated via integration/E2E |

### Notas de Estado

- **Superjson**: Removido del proyecto en Fase 1. No quedan referencias en el código fuente ni en los tests. Los transformers de tRPC ya no usan `superjson`.
- **Defectos de Fase 1**: Todos los defectos identificados en Fase 1 están corregidos (eliminación de SuperJSON, doble trabajo en `getMetrics`, uso de `toIntegrationTRPCError`, helper `DownloadClientItem`, validación en `to-status.ts`).
- **Docker Router**: Nuevo en Fase 2. Aún sin pruebas.

---

## Arquitectura de Pruebas

Los patrones arquitectónicos descritos en [patterns.md] deben probarse siguiendo las convenciones en [docs/TESTING.md].

### Patrón Snapshot + RunLog

El patrón Snapshot + RunLog (sección 2 de [patterns.md]) se implementa mediante:
- **SnapshotStore**: Persistencia del último payload válido para recuperación ante fallos
- **RunLog**: Registro cronológico de ejecuciones con estado, duración y razones de error

Estos componentes deben probarse para validar que:
- El snapshot anterior se mantiene intacto tras un fallo
- El RunLog refleja correctamente el historial de intentos
- La UI muestra el estado apropiado (`fresh`, `outdated`, `missing`) según [docs/TESTING.md]

### Modelo ResultStatus

El modelo de estado de dos ejes (dato + intento) debe probarse para garantizar que:
- Los estados `fresh` y `outdated` se calculan correctamente
- Los casos borde (fallo con datos previos, fallo sin datos previos) se manejan adecuadamente
- La función `dataViewOf` combina ambos ejes para generar un veredicto claro para la UI

Ambas secciones deben alinearse con las convenciones de testing en [docs/TESTING.md].

## Umbrales de Cobertura

Los umbrales de cobertura de código están configurados en `vitest.config.ts`:

- **Statements**: 50%
- **Branches**: 40%
- **Functions**: 50%
- **Lines**: 50%

Los reportes de cobertura se generan en el directorio `coverage/` (`html`, `lcov`, `json` y resumen `text`).