# Arquitectura del Monorepo

Este documento explica las **decisiones estructurales, el por qué de las dependencias y el flujo de datos** de este monorepo. Si buscás comandos de ejecución, configuración o estructura de archivos, consultá el [README principal](../README.md) o los READMEs específicos de cada paquete.

---

## 1. Estrategia de Dependencias y Capas

El monorepo está organizado en capas estrictas donde **las dependencias fluyen hacia adentro (hacia los contratos y utilidades base)**, evitando dependencias circulares y acoplamientos innecesarios.

### Grafo de Capas

```
┌────────────────────────────────────────────────────────┐
│                        apps/*                          │
│                (server, client-react)                  │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┤
│       packages/       │        │       packages/       │
│       integrations    │        │       tasks           │
└───────────┬───────────┘        └───────────┬───────────┘
            │                                │
            └───────────────┬────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │       packages/       │
                │     db / definitions  │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┤
                │       packages/       │
                │       contracts       │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │       packages/       │
                │        common         │
                └───────────────────────┘
```

### Reglas de Importación

| Paquete / App | Puede importar de | Por qué |
| --- | --- | --- |
| `@dashboard/common` | Ninguno (leaf) | Es una librería de utilidades puras sin conocimiento del dominio. |
| `@dashboard/contracts` | `common` (opcional), `zod` | Define el lenguaje común (schemas y tipos) que cruza el límite servidor-cliente. No debe tener lógica de negocio ni dependencias pesadas. |
| `@dashboard/definitions` | `contracts` (solo tipos) | Metadata estática de UI (íconos, nombres, colores). No importa `db` ni `integrations` para poder ser consumido limpiamente por el cliente web. |
| `@dashboard/db` | `contracts` (tipos) | Capa de persistencia con SQLite + Drizzle. Expone conexión y queries sin conocer las integraciones concretas. |
| `@dashboard/integrations` | `common`, `contracts` | Clases adaptadoras para servicios externos. Depende de contratos para validar sus respuestas mediante Zod antes de exponerlas. |
| `@dashboard/tasks` | `db`, `contracts`, `common` | Motor de tareas programadas y persistencia de snapshots. Orquesta corridas sin conocer los detalles de las integraciones (opera mediante interfaces). |
| `@dashboard/server` | Todos los paquetes | Ensambla la API tRPC, inicializa la base de datos, levanta el registry de integraciones y arranca el scheduler. |
| `apps/clients/react` | `@dashboard/contracts`, `@dashboard/definitions` | El cliente web **nunca** importa `db`, `tasks` ni `integrations`. Solo consume tipos y metadatos de UI para mantenerse agnóstico del backend. |

---

## 2. Flujo de Datos y Desacoplamiento

Una de las decisiones clave del proyecto es **separar el ciclo de vida del dato del ciclo de vida del request HTTP**.

### El Problema del Request Directo

En un dashboard tradicional, cuando el usuario abre la página, el servidor recibe un request, llama por red a Sonarr, Radarr, Docker y Prometheus en tiempo real, espera a que todos respondan, y devuelve la respuesta. Si un servicio externo está lento o caído, el dashboard entero se cuelga o falla.

### La Solución: SnapshotStore y Background Tasks

```
[ Servicios Externos ]
       │
       │ (cada N horas / minutos)
       ▼
[ Task Scheduler ] ──(ejecuta)──► [ Integración ]
                                       │
                                       │ (valida con Zod)
                                       ▼
                              [ SnapshotStore (Memoria / DB) ]
                                       ▲
                                       │ (lee instantáneamente)
[ Cliente tRPC ] ──(request)──► [ Fastify / tRPC Router ]
```

1. **Refresco Asíncrono**: Un motor de tareas programadas (`@dashboard/tasks`) ejecuta llamadas periódicas a las integraciones en segundo plano.
2. **Validación Temprana**: Si la integración responde mal o lanza un error, el error se captura, se clasifica (ej. `unreachable`, `timeout`, `invalid-response`) y se registra en el `RunLog`.
3. **Snapshot en Memoria**: El último dato exitativo se guarda en un almacén de snapshots (`SnapshotStore`) respaldado por SQLite.
4. **Lectura Instantánea**: Cuando el cliente hace un request a tRPC, el router **nunca llama a la integración**. Simplemente lee el último snapshot disponible en memoria y evalúa su frescura.

### Patrón Unificado: Snapshot + RunLog (todos los routers de lectura)

**Todos** los routers de lectura usan el mismo patrón snapshot+runlog, independientemente de la integración. No es una exclusividad de calendar ni mediaReleases:

| Router | Consulta | Fuente de datos | Estado |
| --- | --- | --- | --- |
| `calendar` | `getEvents` | `SnapshotStore` + `RunLog.last(taskId)` | ✅ snapshot+runlog |
| `mediaReleases` | `getLatest` | `SnapshotStore` + `RunLog.last(taskId)` | ✅ snapshot+runlog |
| `docker` | `getContainers` | `SnapshotStore` (snapshot por integración) | ✅ snapshot |

El flujo es idéntico: el router obtiene la clave de snapshot (`calendarSnapshot`, `mediaReleasesSnapshot`, `dockerSnapshot`), lee el store, consulta el último `RunLog` para calcular el estado (`toStatus`), y devuelve los datos filtrados/normalizados. La integración subyacente **nunca** es contactada desde el router.

### Mutaciones: Llamadas Directas

Las mutaciones **siempre** realizan llamadas directas a la integración, sin pasar por snapshot ni runlog. No hay un store de escritura para operaciones mutantes:

| Router | Mutaciones | Comportamiento |
| --- | --- | --- |
| `downloads` | `pauseQueue`, `pauseItem`, `resumeQueue`, `resumeItem`, `deleteItem` | Llamada directa a la integración |
| `docker` | `startAll`, `stopAll`, `restartAll`, `removeAll` | Llamada directa a la integración |

Incluso `downloads.getJobs` y `getAllJobs` (consultas) usan llamadas directas, porque los download clients no tienen task programada ni snapshot. Esto es consistente: **solo los datos refrescados por el task scheduler usan snapshot; el resto son llamadas directas**.

### Caché On-Demand (deferido)

El patrón de caché on-demand de estilo Homarr (consultas que se cachean tras la primera llamada y se sirven desde caché hasta que expire) **no está implementado actualmente**. Sería aplicable a routers como `downloads` o futuros endpoints de Prometheus una vez que la API esté estable y se validen las implicaciones de consistencia/edad de datos.

### Ventajas de este Diseño

- **Fallos Parciales Resilientes**: Si Sonarr está caído, el cliente sigue recibiendo el último calendario conocido o un estado de error claro para esa integración específica, sin afectar a Radarr ni colgar el request.
- **Velocidad**: Las queries tRPC responden inmediatamente desde memoria, sin latencia de red hacia servicios externos.

---

## 3. Límites Claros entre Apps y Packages

- **`packages/`** contiene la lógica de dominio pura, reutilizable y testeable de forma aislada. Ningún paquete de `packages/` depende de Fastify ni de tRPC.
- **`apps/server/`** es un adaptador de transporte. Fastify y tRPC viven exclusivamente acá. Su trabajo es conectar el HTTP/tRPC con las instancias de integraciones y el store.
- **`apps/clients/`** son consumidores de la API. No conocen los detalles de cómo se conecta Sonarr ni cómo se guardan los snapshots en SQLite.

---

## Referencias Cruzadas

- Ver [patterns.md](patterns.md) para los patrones de diseño implementados (Registry, Snapshot+RunLog, ResultStatus, Capability Guards, On-Demand Cache).
- Ver [decisions.md](decisions.md) para el contexto de por qué se eligió este diseño frente a alternativas.
- Ver [packages/contracts/README.md](../packages/contracts/README.md) para la especificación del contrato de datos.
