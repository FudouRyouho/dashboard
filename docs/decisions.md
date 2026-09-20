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

## Referencias Cruzadas

- Ver [architecture.md](architecture.md) para la arquitectura general del sistema.
- Ver [patterns.md](patterns.md) para el funcionamiento interno del scheduler y el registry.
