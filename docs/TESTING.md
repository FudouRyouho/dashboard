# Normas y guía de pruebas

Use Vitest para las pruebas unitarias y de integración deterministas. Mantenga las comprobaciones con servicios reales separadas de la suite predeterminada. La fuente de verdad del ejecutor es [vitest.config.ts](../vitest.config.ts); las API auxiliares están documentadas en el [README de testing-utils](../packages/testing-utils/README.md).

## Comandos

Ejecútelos desde la raíz del espacio de trabajo. Son comandos disponibles, no un registro de comprobaciones ejecutadas para esta actualización de la documentación.

| Comando                                            | Propósito                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm test`                                        | Ejecutar una vez las pruebas seleccionadas por las reglas de inclusión y exclusión de Vitest de la raíz. |
| `pnpm test apps/server/src/routers/docker.test.ts` | Filtrar la suite predeterminada a las pruebas del enrutador de Docker. |
| `pnpm test:coverage`                               | Ejecutar la suite seleccionada con cobertura v8 y los umbrales configurados. |
| `pnpm test:watch`                                  | Iniciar Vitest en modo de observación.                              |
| `pnpm typecheck`                                   | Ejecutar la comprobación de TypeScript de la raíz sin emitir JavaScript. |
| `pnpm --filter @dashboard/testing-utils typecheck` | Ejecutar la comprobación de TypeScript del paquete testing-utils.   |

El manifiesto raíz declara Vitest `^5.0.1` y `@vitest/coverage-v8`. La configuración especifica el entorno Node, `singleThread: true` y un tiempo de espera de 120 segundos por prueba. Ese ajuste no implica un presupuesto de memoria medido ni una garantía de aislamiento entre procesos de trabajo.

## Selección de pruebas y cobertura

### Suite predeterminada

Los patrones de inclusión son:

```text
packages/*/src/**/*.test.ts
apps/server/src/**/*.test.ts
apps/clients/react/src/**/*.test.ts
```

Los patrones de exclusión son:

```text
apps/server/src/scripts/trpc-error-smoke.test.ts
apps/server/src/trpc-client.test.ts
apps/server/src/server.e2e.test.ts
apps/server/src/bootstrap/persistence-e2e.test.ts
packages/integrations/src/prometheus/prometheus.e2e.test.ts
references/**
```

Son patrones de configuración, no una afirmación de que todos los archivos enumerados existan actualmente. La suite raíz incluye pruebas del cliente, pero los cambios en su implementación y sus pruebas quedan fuera de este trabajo de alineación de paquetes.

### Comprobaciones de red y persistencia excluidas

Algunas comprobaciones excluidas requieren un backend en ejecución o servicios externos; otras prueban la persistencia y la inicialización por separado. Pasar el nombre de un archivo excluido a `pnpm test` **no** anula la exclusión. Definir una variable de entorno tampoco cambia por sí solo el descubrimiento de pruebas.

Para ejecutar una, revise primero sus requisitos de preparación y entorno y utilice una configuración de Vitest con alcance explícito que la incluya. Esta guía no proporciona una invocación verificada para servicios reales. No eluda las exclusiones en las ejecuciones unitarias habituales ni dependa de servicios de la LAN en pruebas deterministas.

### Configuración de cobertura

La cobertura incluye `packages/*/src/**/*.ts` y `apps/server/src/**/*.ts`, no el código del cliente. Excluye archivos de pruebas y especificaciones, declaraciones, dependencias, resultados de compilación, resultados de cobertura, metadatos de Git y `references/**`, según lo especificado en la configuración raíz.

| Umbral       | Mínimo |
| ---------- | ------- |
| Sentencias | 50%     |
| Ramas      | 40%     |
| Funciones  | 50%     |
| Líneas     | 50%     |

Los informes se guardan en `coverage/` con los formatos `text`, `html`, `lcov` y `json`. Son umbrales configurados, **no cobertura medida**. Se omiten deliberadamente las estimaciones por paquete; use un informe de cobertura real para obtener mediciones.

## Organización y convenciones

- Coloque los archivos `.test.ts` junto al código que prueban.
- Escriba los nombres de las pruebas y las aserciones en inglés usando `describe`, `test`/`it` y `expect` de Vitest.
- Compruebe el comportamiento observable mediante procedimientos públicos o métodos de integración, incluida la validación de salidas, las llamadas a servicios de origen y los efectos de los fallos.
- Inyecte URL, puertos y credenciales sintéticas mediante parámetros de personalización de las fábricas o la configuración de los manejadores HTTP. Nunca copie credenciales reales del entorno en las pruebas.
- Restaure las sustituciones de fetch y cierre los servidores HTTP simulados durante la limpieza. Las pruebas estándar no deben llamar a puntos de acceso externos reales.

## Infraestructura de pruebas compartida

### Puntos de entrada

| Importación                               | Propósito                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `@dashboard/testing-utils/core`      | Interfaces y tipos de pruebas sin fábricas basadas en Vitest.                          |
| `@dashboard/testing-utils/factories` | Simulaciones de integraciones, contextos, almacenes, registros de ejecuciones y bases de datos basadas en Vitest. |
| `@dashboard/testing-utils/fixtures`  | Datos de prueba de errores y respuestas HTTP, incluidos `errorFixtures` y `validateTrpcError`. |
| `@dashboard/testing-utils/msw`       | Manejadores HTTP y funciones auxiliares de servidor para los servicios simulados compatibles. |
| `@dashboard/testing-utils`           | Reexporta las cuatro áreas, **incluido MSW**.                                          |

Prefiera subrutas específicas cuando solo necesite un área. Usar la entrada raíz no aísla MSW del grafo de importaciones; iniciar un servidor HTTP simulado sigue siendo una acción explícita de la prueba.

### Limitaciones del contexto y la base de datos

`createTestTRPCContext()` usa de forma predeterminada integraciones vacías y objetos simulados de registro, almacén y registro de ejecuciones. **El valor predeterminado de `db` es `undefined`**, no una base de datos simulada. Páselo explícitamente cuando un procedimiento necesite acceso a la base de datos.

`createMockDb()` es una colección superficial de funciones espía (`select`, `insert`, `update`, `delete`, `query`, `execute`). No es un motor de consultas Drizzle y no implementa cadenas arbitrarias como `.from().where().all()`. Configure la cadena exacta que necesite una prueba o use una prueba respaldada por una base de datos cuando importe el comportamiento de las consultas. Las simulaciones vacías no demuestran que funcione el comportamiento real con una base de datos vacía.

Asimismo, las lecturas del almacén devuelven `undefined` de forma predeterminada y el historial de ejecuciones está vacío. Proporcione valores personalizados para la instantánea y la última ejecución en escenarios de vigencia de datos y persistencia. Los valores predeterminados de las integraciones son ayudas, no respuestas con validez de esquema garantizada para todos los procedimientos; personalice los datos devueltos para cumplir el contrato de salida que se prueba.

Fuentes: [fábricas de contexto](../packages/testing-utils/src/factories/trpc.ts), [fábrica de bases de datos](../packages/testing-utils/src/factories/database.ts), [fábrica de integraciones](../packages/testing-utils/src/factories/integration.ts).

## Pruebas de enrutadores

Use las fábricas compartidas para comprobar comportamientos concretos. Por ejemplo, el control de Docker requiere tanto el ID de la integración como los ID de los contenedores:

```ts
import { describe, expect, test, vi } from 'vitest';
import {
  createTestIntegration,
  createTestTRPCContext,
} from '@dashboard/testing-utils/factories';
import { errorFixtures } from '@dashboard/testing-utils/fixtures';
import { dockerRouter } from './docker';

describe('dockerRouter.startAll', () => {
  test('starts a container on the selected integration', async () => {
    const integration = createTestIntegration('docker', {
      id: 'docker-1',
      startContainerAsync: vi.fn().mockResolvedValue(undefined),
    });
    const caller = dockerRouter.createCaller(
      createTestTRPCContext({ integrations: [integration] }),
    );

    await expect(
      caller.startAll({ integrationId: 'docker-1', ids: ['container-1'] }),
    ).resolves.toBeUndefined();
    expect(integration.startContainerAsync).toHaveBeenCalledWith('container-1');
  });

  test('maps a timeout to a tRPC error', async () => {
    const integration = createTestIntegration('docker', {
      id: 'docker-1',
      name: 'Docker Host 1',
      startContainerAsync: vi
        .fn()
        .mockRejectedValue(errorFixtures.integration.timeout()),
    });
    const caller = dockerRouter.createCaller(
      createTestTRPCContext({ integrations: [integration] }),
    );

    await expect(
      caller.startAll({ integrationId: 'docker-1', ids: ['container-1'] }),
    ).rejects.toThrow('Failed to start 1 container(s): timeout');
  });
});
```

Un HTTP 304 de Docker es un resultado correcto e idempotente en el límite entre HTTP y la integración. Una simulación de éxito del enrutador debe resolverse normalmente; rechazar con `errorFixtures.integration.unreachable()` prueba un fallo, no un 304. Use `errorFixtures.http.notModified()` al probar la gestión de respuestas HTTP en sí.

Las llamadas a tRPC dentro del mismo proceso no prueban la serialización HTTP. El servidor usa el transporte JSON predeterminado; las pruebas de fechas en el formato de transmisión deben ejercitar ese límite en lugar de asumir que las instancias de `Date` sobreviven a JSON.

## Pruebas HTTP de integraciones

Use simulaciones de fetch para comportamientos HTTP sencillos; use MSW para flujos de autenticación o cookies con varias solicitudes. Hay manejadores compartidos para Sonarr, Radarr, Jellyfin, Docker, qBittorrent y Prometheus. Los manejadores definidos en la propia prueba son adecuados cuando el manejador compartido no modela el escenario.

Para las pruebas con MSW:

1. Importe `setupServer` de `msw/node` y los manejadores necesarios del punto de entrada específico de MSW de testing-utils, o defina manejadores en la propia prueba con `msw`.
2. Inicie el servidor en `beforeAll` con `onUnhandledRequest: 'error'` para detectar solicitudes reales accidentales.
3. Restablezca los manejadores en `afterEach` y cierre el servidor en `afterAll`.
4. Proporcione URL, puertos y credenciales sintéticos que coincidan con la configuración simulada.

Para las sustituciones de fetch, conserve y restaure el fetch original en `finally` o durante la limpieza. Compruebe las rutas de las solicitudes, la autenticación y la gestión pertinente de respuestas mediante métodos públicos de integración.

### Casos de error

Cubra los casos pertinentes para el contrato del método; los datos de prueba ayudan a construir fallos, pero no establecen por sí solos la cobertura.

| Caso                     | Datos de prueba o preparación                                                     | Límite de la aserción                                                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| No autorizado / prohibido | `errorFixtures.integration.unauthorized()` / `.forbidden()`          | Motivo de la integración o código tRPC asignado, según la capa.       |
| Tiempo de espera agotado / inaccesible | `errorFixtures.integration.timeout()` / `.unreachable()`             | Clasificación correcta y conservación del estado cuando corresponda. |
| Respuesta no válida      | `errorFixtures.integration.invalidResponse()` o cuerpo HTTP mal formado | Comportamiento de validación o fallo específico del método.          |
| HTTP 304                 | `errorFixtures.http.notModified()`                                   | Resultado correcto e idempotente cuando el método lo admite.         |
| Respuesta vacía          | Arreglo u objeto vacío con la estructura de esquema requerida         | Resultado vacío válido, no una suposición general de que se acepta `{}`. |
| JSON mal formado         | `errorFixtures.http.malformedJson()`                                 | Rechazo o correspondencia de errores documentada del método.         |

Use `validateTrpcError()` cuando resulte útil validar la estructura compartida de errores tRPC. Las pruebas de enrutadores comprueban códigos y mensajes tRPC, no una propiedad `reason` exclusiva de la integración.

## Pruebas de SQLite y datos programados

Use bases de datos SQLite aisladas para probar la persistencia y las consultas. Las pruebas existentes usan funciones auxiliares como `withTempDb` con rutas únicas; los nuevos archivos de trabajo deben residir en un directorio temporal del sistema recién creado y limpiarse al finalizar, incluidos los archivos auxiliares de la base de datos cuando corresponda. No comparta datos de la aplicación ni dependa de datos precargados.

Pruebe el [patrón Snapshot + RunLog](patterns.md) mediante los adaptadores de base de datos y el planificador:

- Las ejecuciones correctas persisten los datos y registran el intento.
- Las ejecuciones fallidas conservan la instantánea correcta anterior y registran el fallo.
- La instantánea y el historial de ejecuciones sobreviven a la recreación de los adaptadores sobre la misma base de datos.
- Los ID de tarea aíslan los datos de cada integración y la purga respeta las fechas de corte.

Para `ResultStatus`, pruebe los ejes de datos e intentos de forma independiente y verifique `dataViewOf` para `never-queried`, `fresh`, `outdated` y `missing`. Son estados a nivel de contrato, no una afirmación sobre la representación en el cliente.

## Inventario de pruebas: evidencia, no estimaciones de cobertura

Las ubicaciones representativas del código ayudan a localizar pruebas existentes; su presencia no demuestra que sean completas ni acredita un porcentaje:

| Área              | Ubicaciones de pruebas existentes                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Contratos         | `packages/contracts/src/{data-view,docker,download-client,validation}.test.ts`                                       |
| Base de datos     | `packages/db/src/queries/*.test.ts`, `packages/db/src/json-schemas.test.ts`                                          |
| Integraciones     | Pruebas de base y errores, registro, Docker, Prometheus, qBittorrent y determinados esquemas en `packages/integrations/src/`. |
| Tareas            | Pruebas del planificador, concurrencia, reanudación, estrés, base de datos y purga en `packages/tasks/src/`.           |
| Servidor          | Pruebas de enrutadores en `apps/server/src/routers/`, pruebas de inicialización de la base de datos y de ventanas de calendario. |
| Utilidades de pruebas | Infraestructura compartida; no deduzca cobertura de pruebas independientes a partir de la disponibilidad de funciones auxiliares. |

Para consultar las API auxiliares y los detalles de los puntos de entrada, véase el [README de testing-utils](../packages/testing-utils/README.md). Los paquetes tasks, integrations, definitions, contracts y db mantienen cada uno su referencia de API en su propio README. Para conocer la justificación del diseño, véase [decisions.md](decisions.md).
