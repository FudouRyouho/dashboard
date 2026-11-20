# Decisiones arquitectónicas y contexto

Este documento recoge la justificación del diseño y sus alternativas. El **comportamiento actual** describe el código de hoy; el **contexto histórico** conserva decisiones anteriores sin tratarlas como contratos vigentes. Los detalles de las API de los paquetes corresponden a los [README de los paquetes](../packages/integrations/README.md).

## 1. tRPC y transporte de datos

### Decisión actual

Usar el **transporte JSON predeterminado** de tRPC, con tipos y esquemas compartidos de `@dashboard/contracts`. `initTRPC.context<TRPCContext>().create()` en [trpc.ts](../apps/server/src/trpc.ts) no configura ningún transformador personalizado. Las fechas enviadas por HTTP se serializan como cadenas JSON; una llamada dentro del mismo proceso no prueba ese límite de serialización.

Véase la [decisión 11](#11-superjson-removal-historical-context) para conocer la justificación histórica de la eliminación de SuperJSON.

## 2. Planificador de tareas: toad-scheduler + p-queue

### Decisión y justificación

`@dashboard/tasks` combina:

- **toad-scheduler** para tareas periódicas con `preventOverrun: true`, lo que evita ejecuciones superpuestas de la misma tarea.
- **p-queue** para el límite de concurrencia compartido del planificador. La inicialización del servidor proporciona `concurrency: 4`; no es un límite global para las llamadas directas a los enrutadores.

### Alternativas consideradas

- **`setInterval` nativo**: requeriría prevenir explícitamente las superposiciones y gestionar la concurrencia.
- **BullMQ / Redis**: los procesos de trabajo externos y Redis añaden complejidad de infraestructura a un panel personal respaldado por SQLite.

Fuentes: [scheduler.ts](../packages/tasks/src/scheduler.ts), [server.ts](../apps/server/src/server.ts).

## 3. Enrutadores organizados por capacidad en lugar de proveedor

### Decisión

Organizar los enrutadores de negocio por capacidad (`calendar`, `mediaReleases`, `downloads`, `systemHealth`) en lugar de por proveedor (`sonarr`, `radarr`, etc.).

Esto mantiene las lecturas agregadas independientes del proveedor. Por ejemplo, las consultas de calendario seleccionan integraciones que implementan `supportsCalendar`. Añadir otro proveedor de esa capacidad no tiene por qué introducir otro enrutador de negocio.

La configuración y las operaciones dirigidas siguen siendo excepciones explícitas (decisión 5).

## 4. Alcance y temas de diseño pendientes

| Tema                        | Estado actual                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prowlarr                     | Implementado, exportado y registrado con la capacidad `indexerManager`. Proporciona `getIndexersAsync()` y `testAllIndexersAsync()`. No hay un enrutador de negocio de gestión de indexadores ni una tarea programada conectados al servidor. |
| Control de Docker y descargas | Mutaciones directas implementadas, no meras posibilidades futuras de lectura y escritura. Véanse las decisiones 5 y 8.                                                                                                             |
| Autenticación multiusuario   | Se asume un despliegue personal en una LAN/VPN de confianza; las sesiones y los roles de aplicación quedan fuera del diseño actual. Esta suposición no es un mecanismo de control de acceso.                                       |

**Contexto histórico:** antes, Prowlarr figuraba solo en el catálogo y como no implementado. Esa descripción ya no se aplica al paquete de integraciones; su exposición desde el servidor sigue incompleta.

Fuentes: [implementación de Prowlarr](../packages/integrations/src/prowlarr/prowlarr-integration.ts), [registro](../packages/integrations/src/prowlarr/registration.ts), [exportaciones del paquete](../packages/integrations/src/index.ts), [enrutador de la aplicación](../apps/server/src/index.ts), [definiciones de tareas](../apps/server/src/tasks/create-task-definitions.ts).

## 5. Excepciones a la organización por capacidades

### 5.1 Operaciones dirigidas de descargas y Docker

`downloads.getAllJobs` agrega clientes de descargas. `getJobs`, `pauseQueue`, `pauseItem`, `resumeQueue`, `resumeItem` y `deleteItem` requieren un `integrationId` explícito. Las operaciones sobre elementos también identifican un torrent mediante `torrentHash`.

El control de Docker requiere igualmente `{ integrationId, ids }`. Los ID de contenedores no seleccionan implícitamente una integración. Un comando debe dirigirse a un proveedor concreto aunque las lecturas puedan agregar varios proveedores.

Fuentes: [enrutador de descargas](../apps/server/src/routers/downloads.ts), [enrutador de Docker](../apps/server/src/routers/docker.ts).

### 5.2 Configuración de integraciones

El enrutador `integrations` gestiona la configuración de proveedores, no una capacidad de negocio. `upsertIntegrationInputSchema` es una unión discriminada estricta por `kind`: `sonarr`, `radarr`, `jellyfin`, `qbittorrent`, `docker`, `prometheus` y `prowlarr`.

Es necesario conocer el proveedor para validar sus credenciales obligatorias y su puerto predeterminado. Fuente: [contratos de integración](../packages/contracts/src/integrations.ts).

## 6. Lecturas de datos: instantáneas persistidas y consultas directas

### Comportamiento actual

El servidor utiliza `ctx.store` y `ctx.runLog` respaldados por SQLite, creados mediante `createSnapshotStoreDB(db)` y `createRunLogDB(db)`. No son cachés exclusivamente en memoria.

| Ruta de lectura                   | Fuente de datos                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `calendar`, `mediaReleases` | Instantáneas programadas más historial de ejecuciones                                                        |
| `docker.getContainers`      | Estadísticas del panel y estado de ejecución de la instantánea, más una solicitud **en directo** de la lista de contenedores por integración Docker |
| Consultas de detalle de Docker | Llamadas directas a la integración para la lista de contenedores, registros, estadísticas de contenedores y del sistema |
| `downloads`, `systemHealth` | Llamadas directas a las integraciones durante la consulta                                                     |

Las mutaciones llaman directamente a las integraciones; no pasan por el planificador ni actualizan las instantáneas. Los metadatos de instantáneas y registros de ejecuciones separan los últimos datos obtenidos correctamente del último intento, lo que conserva datos útiles tras un sondeo fallido.

### Justificación y corrección histórica

Las instantáneas desacoplan las lecturas programadas de la latencia del servicio de origen y conservan los datos obtenidos correctamente entre reinicios. Las llamadas de control directas actúan de inmediato en lugar de esperar al siguiente sondeo.

**Contexto histórico:** la regla anterior «todas las consultas usan instantáneas» era demasiado amplia, y su descripción de «memoria local» está obsoleta. Las consultas directas siguen dependiendo de la red; la latencia de las instantáneas no debe generalizarse a todos los puntos de acceso.

Fuentes: [inicialización del servidor](../apps/server/src/server.ts), [adaptador de instantáneas](../packages/tasks/src/store.ts), [adaptador del registro de ejecuciones](../packages/tasks/src/run-log.ts), [enrutador de Docker](../apps/server/src/routers/docker.ts), [enrutador de descargas](../apps/server/src/routers/downloads.ts), [enrutador del estado del sistema](../apps/server/src/routers/systemHealth.ts).

## 7. Invalidación de instantáneas bajo demanda: aplazada

### Decisión y justificación

Las instantáneas programadas se actualizan mediante sondeo, no mediante invalidación activada por mutaciones. Coordinar la mutación, la invalidación y la reejecución inmediata añadiría estado compartido y condiciones de carrera mientras la API sigue evolucionando.

La tarea de Docker usa de forma predeterminada un intervalo de 30 segundos y `runOnStart: true`. Las lecturas directas de Docker pueden devolver datos de contenedores más recientes que la instantánea de estadísticas. No debe interpretarse esta decisión como una prohibición de consultas en directo ni como una garantía de una ventana exacta de vigencia de los datos.

**Contexto histórico:** se dejó pendiente reconsiderar la invalidación bajo demanda, la actualización manual y las actualizaciones enviadas por el servidor tras estabilizar la API; esto es una justificación, no un compromiso de entrega.

Fuente: [tarea de Docker](../apps/server/src/tasks/docker-task.ts).

## 8. Docker: lectura agregada y control dirigido

### Contratos actuales

| Procedimiento                                        | Entrada y salida                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getContainers`                                  | Sin entrada; devuelve entradas `{ integration, status, stats, containers }`. `stats` procede de la instantánea programada (estadísticas a cero si no existe); `containers` se obtiene en directo. Las solicitudes fallidas a integraciones se omiten del agregado. |
| `getContainerList`                               | `{ integrationId }`; devuelve `DockerContainer[]` validado mediante esquema a partir de una solicitud en directo.                                                                                                                             |
| `getContainerLogs`                               | `{ integrationId, containerId, ...logOptions }`; devuelve `string[]`. Los valores predeterminados incluyen `tail: 100`, stdout/stderr habilitados y marcas temporales/seguimiento deshabilitados.                                               |
| `getContainerStats`                              | `{ integrationId, containerId }`; solicitud en directo, la salida del enrutador es `z.unknown()`.                                                                                                                                             |
| `getSystemStats`                                 | `{ integrationId }`; solicitud en directo, la salida del enrutador es `z.unknown()`.                                                                                                                                                          |
| `startAll`, `stopAll`, `restartAll`, `removeAll` | `{ integrationId, ids: string[] }`; se dirigen a una integración Docker y se resuelven con `void` si tienen éxito.                                                                                                                             |

Las operaciones de control intentan procesar cada ID proporcionado de forma secuencial. Los fallos se registran; cualquier fallo provoca un error tRPC al terminar los intentos, aunque las operaciones sobre otros contenedores hayan tenido éxito. No es una transacción atómica. El enrutador acepta un arreglo `ids` vacío; el esquema independiente `dockerContainerActionInputSchema` exige al menos un ID, por lo que esos validadores no son intercambiables.

`dockerTask` sondea `getDashboardStatsAsync()` y almacena estadísticas, no la lista de contenedores devuelta por la consulta agregada. Existen contratos de políticas de Docker, pero el arranque del servidor solo copia actualmente las políticas de calendario y lanzamientos multimedia al mapa de políticas de tareas; las personalizaciones persistidas de Docker no se aplican ahí.

**Contexto histórico:** la descripción original del enrutador solo cubría `getContainers` y cuatro mutaciones, omitía el estado y los datos de contenedores en directo, y describía incorrectamente `{ ids }` como entrada suficiente para el enrutamiento.

Fuentes: [enrutador de Docker](../apps/server/src/routers/docker.ts), [contratos de Docker](../packages/contracts/src/docker.ts), [tarea de Docker](../apps/server/src/tasks/docker-task.ts), [inicialización del servidor](../apps/server/src/server.ts).

## 9. Prometheus: métricas normalizadas, sin enrutadores por métrica

### Decisión y salida actual

Mantener `systemHealth.getAllMetrics` y `getMetrics`; no añadir procedimientos separados para CPU, memoria, disco o red sin una necesidad concreta.

- `getAllMetrics` descubre, normaliza y agrega métricas en el servidor. Devuelve una entrada `{ integration, server, metrics: ServerMetrics[] }` por instancia descubierta, que actualmente contiene un agregado en `metrics`. Las integraciones fallidas no aportan entradas.
- `getMetrics({ server })` busca primero una integración cuyo **ID** sea igual a `server` y después pasa la misma cadena a `getServerMetricsAsync`, reutilizando los datos descubiertos. Devuelve `null` si no existe una integración compatible que coincida; en caso contrario, devuelve `{ integration, metrics }` con un arreglo vacío cuando las métricas no están disponibles o falla su obtención. El parámetro no es un selector independiente de instancias.
- `ServerMetrics` agrupa CPU, memoria, discos, red y sensores. Los contratos usan `z.custom<ServerMetrics[]>()`, que proporciona el tipo de TypeScript pero no valida en profundidad esa estructura de métricas en tiempo de ejecución.

**Contexto histórico:** la descripción anterior de datos sin procesar de tipo `unknown[]` está obsoleta. La normalización ya existe; aplazar los puntos de acceso por métrica no implica aplazar los datos estructurados.

Fuentes: [enrutador del estado del sistema](../apps/server/src/routers/systemHealth.ts), [contratos de resultados](../packages/contracts/src/result.ts), [tipos de métricas](../packages/contracts/src/system-health-types.ts).

## 10. Credenciales de qBittorrent: nombre de usuario y contraseña obligatorios

### Decisión y contrato actual

Admitir en esta integración el inicio de sesión mediante formulario con nombre de usuario y contraseña:

- La rama de qBittorrent de `upsertIntegrationInputSchema` exige `username` y `password` no vacíos; su puerto predeterminado es `8080`.
- El objeto es `.strict()`. `apiKey` no es un campo de esa rama y se rechaza como clave desconocida, no mediante un campo explícito `z.never()`.
- La inicialización valida los secretos obligatorios y asigna los campos de credenciales a `secrets[]`.
- La integración envía una solicitud POST a `/api/v2/auth/login` y reutiliza la cookie SID devuelta.

Una única vía de autenticación implementada mantiene alineados la configuración y el comportamiento en tiempo de ejecución. Es un contrato de esta integración, no una afirmación sobre la compatibilidad con claves de API en versiones concretas de qBittorrent ni sobre columnas no anulables de la base de datos.

**Corrección histórica:** la afirmación anterior sobre claves de API según la versión, la descripción de `z.never()` y la afirmación sobre nulabilidad de la base de datos específica del proveedor no estaban respaldadas por el contrato actual.

Fuentes: [contratos de integración](../packages/contracts/src/integrations.ts), [inicialización](../apps/server/src/bootstrap/integrations.ts), [integración de qBittorrent](../packages/integrations/src/qbittorrent/qbittorrent-integration.ts).

<a id="11-superjson-removal-historical-context"></a>

## 11. Eliminación de SuperJSON (contexto histórico)

La decisión de transporte anterior eliminó SuperJSON para simplificar los clientes de CLI y depuración y las pruebas HTTP: los consumidores de JSON convencional no deberían necesitar un transformador personalizado correspondiente. Esto sigue siendo coherente con la decisión 1.

La antigua lista de archivos por fase o tarea y la nota sobre la comprobación de tipos eran notas históricas de implementación, no resultados de verificación actuales. La evidencia actual es la ausencia de un transformador personalizado en la [inicialización de tRPC](../apps/server/src/trpc.ts); este documento no afirma que todos los valores públicos conserven su tipo JavaScript original tras un recorrido de ida y vuelta por JSON.

## Véase también

- [Arquitectura](architecture.md)
- [Patrones](patterns.md)
- [Guía de pruebas](TESTING.md)
