# Decisiones Arquitectónicas y Contexto

Este documento registra el **por qué** de las decisiones tecnológicas y de diseño más importantes tomadas durante el desarrollo del proyecto, así como los caminos alternativos que se descartaron y los temas que se dejaron deliberadamente abiertos.

---

## 1. SuperJSON vs JSON Plain en tRPC

### Contexto
Al comunicar el servidor Fastify con los clientes mediante tRPC, los objetos de datos devueltos contienen frecuentemente instancias de `Date` (ej. marcas de tiempo de eventos de calendario o corridas de tareas).

### La Decisión
Se adoptó **SuperJSON** como transformador de tRPC (`transformer: superjson`).

### Por qué y Trade-offs
- **Ventaja**: JSON estándar serializa las fechas como strings ISO planos, obligando al cliente a parsearlas manualmente (`new Date(...)`) en cada componente. SuperJSON serializa tipos complejos como `Date`, `Map` y `Set` preservando sus tipos nativos a través del límite de red de forma transparente.
- **Trade-off**: Añade una dependencia de serialización en el cliente, que debe configurar su propio enlace tRPC con SuperJSON para poder deserializar correctamente las respuestas.

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

## 4. Estado Abierto: Temas Diferidos y Fuera de Alcance

Para mantener el proyecto enfocado y evitar una complejidad innecesaria, se tomaron decisiones explícitas sobre qué **no** construir en esta etapa (documentado detalladamente en `.working/integrations-e2e-gap-analysis.md`):

- **Prowlarr**: Su integración como gestor de indexers está diseñada en la capa de definiciones, pero no se implementó en runtime porque el dashboard actual no requiere administración de indexers, solo lectura de contenido multimedia.
- **Missing / Queue en Sonarr y Radarr**: Solo se implementó la capacidad de `calendar`. Las colas de descargas y faltantes implican una superficie de mutaciones y contratos complejos que exceden el objetivo de visualización de solo lectura.
- **Administración de Docker**: Se implementó `dashboardStats` (estado global de contenedores), pero se descartó el control completo de contenedores (start/stop/restart/logs), ya que el propósito es monitoreo, no orquestación.
- **WebSockets / Tiempo Real**: Se evaluó WebSockets para notificaciones en vivo, pero se descartó en favor de tareas programadas con polling HTTP/tRPC, dado que la red local y la baja frecuencia de cambios en un entorno doméstico no justifican la complejidad de mantener conexiones persistentes.
- **Autenticación Multi-usuario**: El proyecto asume una red LAN/VPN confiable y de uso personal (single-user). No hay manejo de sesiones, cookies de aplicación ni roles.

---

## Referencias Cruzadas

- Ver [architecture.md](architecture.md) para la arquitectura general del sistema.
- Ver [patterns.md](patterns.md) para el funcionamiento interno del scheduler y el registry.
- Ver `.working/integrations-e2e-gap-analysis.md` para el análisis técnico completo de integraciones y decisiones diferidas.
