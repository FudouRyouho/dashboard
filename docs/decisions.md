# Decisiones Arquitectónicas y Contexto

Este documento registra el **por qué** de las decisiones tecnológicas y de diseño más importantes tomadas durante el proyecto, así como los caminos alternativos que se descartaron y los temas que se dejaron deliberadamente abiertos.

---

## 1. tRPC y Transporte de Datos

### Contexto

Al comunicar el servidor Fastify con los clientes mediante tRPC, se requiere un mecanismo robusto para serializar y deserializar tipos de datos entre el backend y el cliente.

### La Decisión

Se utiliza tRPC con transformadores estándar y tipos seguros definidos en `@dashboard/contracts`.

---

## 2. Elección del Task Scheduler: toad-scheduler + p-queue

### Contexto

El servidor necesita ejecutar consultas periódicas a servicios externos (Sonarr, Radarr, etc.) en segundo plano, controlando intervalos de tiempo y evitando sobrecargar la red o los servicios destino.

### La Decisión

Se combinaron dos librerías especializadas en `@dashboard/tasks`:

1. **`toad-scheduler`**: Gestiona los temporizadores (cron-like / intervalos) y previene el solapamiento de ejecuciones (`preventOverrun: true`), asegurando que si una tarea se extiende más allá de su intervalo, no se dispare una segunda instancia en paralelo.
2. **`p-queue`**: Controla el techo de concurrencia global del proceso (ej. máximo 4 requests concurrentes hacia la red local), evitando saturar las APIs de los servicios domésticos.

### Alternativas Consideradas y Descartadas

- **`setInterval` nativo de Node.js**: Descartado porque no maneja prevención de solapamientos (si un request se traba, `setInterval` apila ejecuciones infinitamente) ni ofrece colas de concurrencia.
- **BullMQ / Redis**: Descartado por completo. Introducir Redis y workers externos en un dashboard personal de uso local añade una complejidad de infraestructura injustificada para un proyecto monolítico en SQLite.

---

## 3. Routers Organizados por Capacidad (en vez de por Integración)

### Contexto

Un sistema inspirado en Homarr maneja múltiples servicios (Sonarr, Radarr, Jellyfin). ¿Cómo deben estructurarse los endpoints del servidor tRPC?

### La Decisión

Los routers se organizan por **capacidad de negocio** (`calendar`, `mediaReleases`, `downloads`, `systemHealth`) y no por proveedor (`sonarr`, `radarr`, etc.).

### Por qué

- **Independencia del Cliente**: La UI del dashboard quiere mostrar "el calendario unificado de películas y series", sin importarle si los datos vienen de Sonarr, Radarr o de tres instancias distintas de Sonarr. El router `calendar.getEvents` agrupa automáticamente todas las integraciones que implementan `supportsCalendar`.
- **Extensibilidad**: Si mañana agregamos un nuevo proveedor de calendario, la UI no cambia; el router simplemente lo incluye en el resultado agregado.

---

## 4. Estado Abierto: Temas de Diseño y Alcance Futuro

Para mantener el proyecto enfocado y evitar una complejidad innecesaria en esta etapa inicial, se definieron los siguientes criterios sobre componentes y capacidades:

- **Prowlarr**: Aunque se encuentra referenciado en catálogos de definiciones, su integración en runtime no está implementada y se evaluará cuando exista un caso de uso concreto.
- **Capacidades de Escritura (Read/Write en Docker y Descargas)**: Docker y los clientes de descarga (como qBittorrent) son naturalmente bidireccionales (lectura y escritura). Aunque el proyecto prioriza la visualización y monitoreo (read), el diseño debe contemplar o permitir operaciones de control (como pausa/reanudación de tareas o gestión de contenedores) donde tenga sentido práctico para un dashboard personal.
- **Autenticación Multi-usuario**: El proyecto asume una red LAN/VPN confiable y de uso personal (single-user). No hay manejo de sesiones, cookies de aplicación ni roles en esta etapa.

---

## 5. Excepciones a la Regla de Organización por Capacidad

Aunque la decisión principal es organizar los routers por capacidad de negocio, existen casos donde esto no es práctico o semánticamente correcto. Las siguientes excepciones están documentadas explícitamente:

### 5.1 Router `downloads.ts` - Operaciones de Control Requieren `integrationId`

El router `downloads.ts` incluye un endpoint de lectura agregado `getAllJobs` que retorna trabajos de todos los clientes de descarga (siguiendo el patrón de capacidad). Sin embargo, los endpoints de escritura/control (`pauseQueue`, `pauseItem`, `resumeQueue`, `resumeItem`, `deleteItem`) y el endpoint de lectura específico `getJobs` requieren `integrationId` explícito.

**Justificación**: Las operaciones de control sobre un cliente de descargas (qBittorrent) son inherentemente específicas de un proveedor. Un cliente no puede pausar la cola de otro cliente. Requerir `integrationId` en estas operaciones refleja la semántica real del dominio y no viola la independencia del cliente para operaciones de lectura agregada.

### 5.2 Router `integrations.ts` - Administración de Configuración por Proveedor

El router `integrations.ts` gestiona el ciclo de vida completo de las integraciones (crear, leer, actualizar, eliminar). Utiliza una union discriminada por `kind` (`sonarr`, `radarr`, `jellyfin`, `docker`, `qbittorrent`) en `upsertIntegrationInputSchema`.

**Justificación**: Este es un router de **administración de configuración**, no de capacidades de negocio. Para crear una integración, la UI debe especificar qué tipo de proveedor es (es mandatorio conocer el `kind` para configurar credenciales específicas como `apiKey`, `port`, etc.). No tiene sentido conceptual un "upsertIntegration" genérico sin conocer el tipo de proveedor. Es una excepción aceptable y necesaria a la regla de organización por capacidad.

---

## 6. Estrategia de Lectura de Datos: Snapshot + RunLog para Lecturas, Llamadas Directas para Mutaciones

### Contexto

El sistema ejecuta tareas periódicas (calendar, mediaReleases, docker) que consultan APIs externas y guardan resultados en un almacén de snapshots (`ctx.store`) junto con un registro de ejecuciones (`ctx.runLog`).

### La Decisión

- **Todas las lecturas (queries tRPC)** usan **snapshot + runLog**: leen el último resultado guardado en `ctx.store` y el estado de la última ejecución en `ctx.runLog`, sin disparar llamadas de red en tiempo de respuesta.
- **Todas las mutaciones** (control de Docker, pausa/reanudación de descargas, etc.) usan **llamadas directas** a la integración correspondiente, sin pasar por el scheduler ni el snapshot store.

### Por qué

- **Latencia predecible**: Las queries responden en milisegundos desde memoria local, no dependen de la latencia de red de Sonarr/Radarr/Docker/Prometheus.
- **Consistencia**: El cliente siempre ve el estado "confirmado" por la última ejecución exitosa de la tarea, junto con metadatos de cuándo fue y si hubo errores.
- **Control de concurrencia**: Las mutaciones ejecutan directamente contra la API del servicio, permitiendo control fino (pausar un torrent específico, reiniciar un contenedor específico) sin esperar al siguiente ciclo de la tarea periódica.
- **Separación de responsabilidades**: El scheduler se encarga de *observar* (polling), las mutaciones se encargan de *actuar* (comandos).

### Implementación

- Routers `calendar`, `mediaReleases`, `docker.getContainers`: usan `ctx.store.get(key)` + `ctx.runLog.last(taskId)`.
- Router `docker` mutaciones (`startAll`, `stopAll`, `restartAll`, `removeAll`): iteran integraciones Docker y llaman `startContainerAsync`/`stopContainerAsync`/etc. directamente.
- Router `downloads` mutaciones: llaman `pauseQueueAsync`/`resumeQueueAsync`/`pauseItemAsync`/etc. directamente.

---

## 7. Evaluación de Caché On-Demand: Diferida hasta Estabilidad de API

### Contexto

Los snapshots actuales se actualizan en intervalos fijos (30s para Docker, configurable para calendar/mediaReleases). Un patrón alternativo sería invalidar/actualizar el caché on-demand tras una mutación exitosa.

### La Decisión

**No implementar invalidación de caché on-demand en esta fase.** Se mantiene el intervalo fijo del scheduler como única fuente de actualización de snapshots.

### Por qué

- **Complejidad vs. valor**: Invalidar on-demand requiere coordinar mutación + invalidación + posible re-ejecución inmediata de la tarea, añadiendo estado compartido y race conditions.
- **API inestable**: Los contratos tRPC y las integraciones aún están en evolución. Añadir lógica de caché reactiva ahora crea deuda técnica que se descartaría al estabilizar la API.
- **Acceptable UX**: Con intervalos de 30s (Docker) y configurables (otros), la stale-read window es aceptable para un dashboard de monitoreo personal.
- **Deferred decision**: Cuando la API sea estable (v1.0), se evaluará: invalidación on-demand, `refetch` manual en UI, o WebSockets/push para updates en tiempo real.

---

## 8. Integración Docker: Router Completo con getContainers + Mutaciones

### Contexto

Docker es una integración bidireccional natural: monitoreo de contenedores (read) + control de ciclo de vida (start/stop/restart/remove).

### La Decisión

Crear `dockerRouter` completo con:
- **Query**: `getContainers` — retorna array de `{ integration, stats: DockerDashboardStats }` leyendo de `ctx.store` (snapshot del task `docker`).
- **Mutaciones**: `startAll`, `stopAll`, `restartAll`, `removeAll` — input `{ ids: string[] }`, llaman directamente a métodos de la integración Docker (`startContainerAsync`, etc.) con `toIntegrationTRPCError` para errores.

### Por qué

- **Paridad con downloads**: Siguiendo el patrón del router `downloads` (lectura agregada + mutaciones por `integrationId` implícito via `ids` array).
- **Task `docker` dedicada**: Nuevo task `dockerTask` con intervalo 30s, `runOnStart: true`, que ejecuta `getDashboardStatsAsync()` y guarda en snapshot store.
- **Políticas de tarea**: Extendido enum `taskType` en DB y router `policies` para incluir `'docker'`, permitiendo configurar intervalo/cooldown por integración.

### Referencias

- `apps/server/src/routers/docker.ts` — router completo
- `apps/server/src/tasks/docker-task.ts` — task definition
- `apps/server/src/tasks/task-ids.ts` — `dockerSnapshot` helper

---

## 9. Prometheus: Solo getAllMetrics, Endpoints Estructurados Diferidos

### Contexto

Prometheus expone métricas vía PromQL. El router `systemHealth` provee dos endpoints:
- `getAllMetrics`: métricas de todas las instancias descubiertas (11 queries PromQL en paralelo)
- `getMetrics`: métricas de un servidor específico

### La Decisión

**Mantener solo `getAllMetrics` y `getMetrics` (reutilizando datos descubiertos). Diferir endpoints estructurados por tipo de métrica (CPU, memoria, disco, red, etc.).**

### Por qué

- **Optimización existente**: `getMetrics` ya reutiliza `getDiscoveredDataAsync()` + `getServerMetricsAsync()` para evitar doble discovery + 11 queries (ver Fase 1, Task 2).
- **YAGNI**: Endpoints estructurados (`getCpuMetrics`, `getMemoryMetrics`, etc.) requieren normalización y mapeo adicionales que no tienen caso de uso actual.
- **Flexibilidad**: El array `metrics: unknown[]` en `getAllMetrics` permite a la UI consumir lo que necesite sin acoplar el backend a formas de presentación específicas.
- **Future-proof**: Cuando la UI requiera vistas específicas, se añadirán normalizadores y endpoints tipados sin breaking changes.

---

## 10. qBittorrent Credenciales: username/password requerido, apiKey prohibido

### Contexto

qBittorrent WebUI soporta autenticación via:
- **apiKey** (header `X-Api-Key`, introducido en v4.5.0)
- **username/password** (form login, legacy pero universal)

### La Decisión

Soportar **exclusivamente** `username`+`password` en la integración qBittorrent:
- Schema `upsertIntegrationInputSchema` REQUIERE `username` Y `password` (ambos string.min(1)).
- `apiKey` está explícitamente prohibido (`z.never()`). No se acepta.
- DB: columnas `username` y `password` requeridos, `apiKey` nullable pero no usado.
- Bootstrap: `toInput()` mapea `username`+`password` a `secrets[]` array.
- Integración: `getClientAsync()` usa siempre `username`+`password`.

### Por qué

- **Simplicidad**: Un solo camino de autenticación reduce complejidad y errores.
- **Compatibilidad**: Usuarios en versiones antiguas de qBittorrent (< 4.5) necesitan username/password (y es el único método disponible en esas versiones).
- **Seguridad**: username/password es el método soportado universalmente; apiKey es opcional en nuevas versiones pero no necesario.
- **Type safety**: El schema discrimine garantiza que no se pueda crear una integración qBittorrent con apiKey (el error sería silencioso en runtime).

---

## 11. SuperJSON: Eliminado para Simplicidad CLI/Testing

### Contexto

SuperJSON era usado como transformer tRPC para serializar tipos como `Date`, `Set`, `Map`, `undefined`, etc.

### La Decisión

**Eliminar SuperJSON completamente.** Usar transformador por defecto de tRPC (JSON estándar).

### Por qué

- **Simplicidad CLI**: Scripts de testing y debugging (`trpc-client.test.ts`, smoke tests) fallaban o requerían setup extra para deserializar fechas.
- **Testing directo**: `fetch` + `JSON.parse` funciona out-of-the-box contra endpoints tRPC sin transformer especial.
- **Tipos usados**: El proyecto usa principalmente tipos primitivos + `Date` (serializados como ISO string nativo por JSON). No se usan `Set`, `Map`, `undefined`, `NaN`, `Infinity` en contratos públicos.
- **Bundle size**: Una dependencia menos en cliente y servidor.

### Cambios Realizados (Fase 1, Task 1)

- Eliminado `import superjson` y `transformer: superjson` de 4 archivos:
  - `apps/server/src/trpc.ts`
  - `apps/server/src/trpc-client.test.ts`
  - `apps/server/src/scripts/trpc-error-smoke.test.ts`
  - `package.json` (dependencia removida)
- Typecheck pasa sin errores nuevos.

---

## Referencias Cruzadas

- Ver [architecture.md](architecture.md) para la arquitectura general del sistema.
- Ver [patterns.md](patterns.md) para el funcionamiento interno del scheduler y el registry.