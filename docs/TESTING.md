# Estándares y Guías de Testing

Este documento describe las convenciones, patrones e infraestructura de testing para el monorepo del dashboard.

## Visión General

El repositorio utiliza **Vitest** como test runner con soporte TypeScript nativo y reporte de cobertura con v8.

- **Framework de Testing**: Vitest `^5.0.1`
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

Para flujos de auth complejos (ej. qBittorrent con cookie-based auth), se prefiere **MSW** (`msw/node`) con handlers inline en el test file sobre el mock de `global.fetch`. Ver sección [Parametrización de Tests de Integración](#parametrización-de-tests-de-integración-obligatorio).

---

## Parametrización de Tests de Integración (Obligatorio)

Todos los tests que ejerciten integraciones externas **DEBEN** usar `@dashboard/testing-utils` y aceptar parámetros de runtime (`{url, port, credentials}`) mediante factories. Nunca hardcodear URLs, puertos, o credenciales del entorno real en tests.

### Arquitectura de Infraestructura de Testing

La infraestructura de testing se organiza en tres capas:

| Capa | Qué es | Quién lo usa | Ejemplo |
|-------|--------|--------------|---------|
| **Interfaces base** | Interfaces TypeScript puras (zero deps) | Todos los packages | `TestIntegration<K>`, `TestDb`, `TestTRPCContext` |
| **Factories** | Factories que devuelven `vi.fn()`-wrapped defaults | Tests de router, unit tests | `createTestIntegration()`, `createTestTRPCContext()` |
| **Handlers HTTP** | Handlers HTTP reales con `msw/node` (opt-in por archivo) | Tests de cliente de integración | `qbittorrentHandlers`, `setupServer()` |

### Importación

```ts
// Interfaces + factories + fixtures
import { createTestIntegration, createTestTRPCContext, errorFixtures } from '@dashboard/testing-utils';

// Handlers HTTP (opt-in por archivo de test)
import { setupServer } from 'msw/node';
import { qbittorrentHandlers } from '@dashboard/testing-utils/msw';
```

### Patrón Obligatorio — Tests de Router

```ts
import { describe, test, expect, vi } from 'vitest';
import { dockerRouter } from './docker';
import { createTestIntegration, createTestTRPCContext, errorFixtures } from '@dashboard/testing-utils';

describe('dockerRouter.startAll', () => {
  test('starts container successfully', async () => {
    // Parámetros inyectados vía factory — nunca hardcodear runtime
    const integration = createTestIntegration('docker', {
      id: 'docker-1',
      name: 'Docker Host 1',
      url: 'http://test:2375',
      port: 2375,
      startContainerAsync: vi.fn().mockResolvedValue(undefined),
    });

    const ctx = createTestTRPCContext({ integrations: [integration] });
    const caller = dockerRouter.createCaller(ctx);

    await caller.startAll({ ids: ['container-1'] });
    expect(integration.startContainerAsync).toHaveBeenCalledWith('container-1');
  });

  test('handles HTTP 304 as idempotent success', async () => {
    const integration = createTestIntegration('docker', {
      id: 'docker-304',
      name: 'Docker 304',
      url: 'http://test:2375',
      port: 2375,
      startContainerAsync: vi.fn().mockRejectedValue(errorFixtures.integration.unreachable(new Error('Not Modified'))),
    });

    const ctx = createTestTRPCContext({ integrations: [integration] });
    const caller = dockerRouter.createCaller(ctx);

    await expect(caller.startAll({ ids: ['c1'] })).resolves.toBeUndefined();
  });
});
```

### Patrón Obligatorio — Tests de Cliente

Para integraciones con flujos de auth complejos (cookie-based login, tokens), usa MSW con handlers inline:

```ts
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QbittorrentIntegration } from './qbittorrent-integration';

const server = setupServer(
  http.post('http://localhost:8080/api/v2/auth/login', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    if (params.get('username') === 'test-user' && params.get('password') === 'test-pass') {
      return new Response('Ok.', { status: 200, headers: { 'Set-Cookie': 'SID=test-sid; Path=/; HttpOnly' } });
    }
    return new Response('Forbidden.', { status: 403 });
  }),
  http.get('http://localhost:8080/api/v2/torrents/info', ({ request }) => {
    if (!request.headers.get('cookie')?.includes('SID=')) return new Response('', { status: 403 });
    return HttpResponse.json([/* ...torrents */]);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Cobertura de Edge Cases Requerida

Todo test de router o cliente de integración DEBE cubrir al menos los siguientes casos de error usando `errorFixtures`:

| Caso | Fixture | Ejemplo de Assert |
|------|---------|-------------------|
| **401 Unauthorized** | `errorFixtures.integration.unauthorized()` | `rejects.toMatchObject({ reason: 'unauthorized' })` |
| **403 Forbidden** | `errorFixtures.integration.forbidden()` | `rejects.toMatchObject({ reason: 'forbidden' })` |
| **Timeout** | `errorFixtures.integration.timeout()` | `rejects.toMatchObject({ reason: 'timeout' })` |
| **Unreachable** | `errorFixtures.integration.unreachable()` | `rejects.toMatchObject({ reason: 'unreachable' })` |
| **Respuesta inválida** | `errorFixtures.integration.invalidResponse()` | `rejects.toMatchObject({ reason: 'invalid-response' })` |
| Caso | Fixture | Ejemplo de Assert |
|------|---------|-------------------|
| **HTTP 304 (idempotente)** | `errorFixtures.http.notModified()` | No debe lanzar; éxito idempotente |
| **Respuesta vacía** | response `[]` o `{}` | Debe devolver datos vacíos sin lanzar |
| **JSON malformado** | `errorFixtures.http.malformedJson()` | `rejects.toThrow()` (o razón `invalid-response`) |

### Reglas

1. **No hardcodear datos de runtime** — URLs, puertos, credenciales se inyectan vía factory params o config de MSW.
2. **Soportar DB vacía** — Los tests de router usan `createMockDb()`; no dependen de seeds ni migraciones.
3. **Usar `errorFixtures`** — Nunca inventar shapes de error ad-hoc; usa los fixtures canónicos.
4. **Handlers HTTP es opt-in** — Solo se usa donde se testea HTTP real del cliente (no en routers).
5. **Validar shape de error con Zod** — `validateTrpcError()` para errores TRPC cuando se requiere validación fuerte.

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
| **`@dashboard/integrations`** | Specific clients (Prometheus, qBittorrent, Docker, Jellyfin, Sonarr, Radarr) | HTTP mocks + schemas | ⚠️ Partial (varied) | qBittorrent: medium (handlers HTTP); Prometheus: medium; Docker/Jellyfin/Sonarr/Radarr: low |
| **`@dashboard/tasks`** | Scheduler, run-log, store, purge (`scheduler.ts`, `run-log.ts`, `store.ts`, `purge.ts`) | SQLite integration + async | ✅ Implemented (~95%) | Strong coverage in task lifecycle and persistence |
| **`@dashboard/testing-utils`** | Infraestructura de testing (interfaces, factories, handlers HTTP, fixtures) | Test infrastructure | ✅ Implemented (100%) | See [Parametrización](#parametrización-de-tests-de-integración-obligatorio) |
| **`apps/server`** | tRPC routers (`calendar.ts`, `downloads.ts`, `integrations.ts`, `media-releases.ts`, `docker.ts`, `systemHealth.ts`) | tRPC integration / Mock DB | ⚠️ Partial (~60%) | Routers principales migrados a factories; pendiente: `calendar`, `media-releases`, `policies` |
| **`apps/server`** | Docker router (`docker.ts`) | tRPC integration / Mock DB | ✅ Implemented (~80%) | Factory pattern con `createTestIntegration`; edge cases 304/404/timeout cubiertos |
| **`apps/server`** | Server bootstrapping (`server.ts`, `main.ts`, `config.ts`) | Startup / smoke | ⚠️ Pending (0%) | Low priority for unit; validated via integration/E2E |


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