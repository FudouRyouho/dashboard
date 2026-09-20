# Patrones de Diseño en el Monorepo

Este documento describe los **patrones arquitectónicos recurrentes** que estructuran el código de este proyecto. Su objetivo es explicar cómo se resuelven problemas comunes (registro de servicios, gestión de estado asíncrono, modelado de errores y filtrado por capacidades) de forma consistente.

---

## 1. Registry Pattern (Registro de Integraciones)

### El Problema
El servidor necesita instanciar dinámicamente servicios externos (Sonarr, Radarr, Jellyfin, Docker, etc.) basándose en las filas guardadas en la base de datos al arrancar, sin que el servidor tenga que conocer de antemano todos los tipos de integración ni importar directamente cada archivo de clase.

### La Solución
Cada paquete de integración implementa un mecanismo de autorregistro utilizando el módulo central `packages/integrations/src/registry.ts`.

1. **Factory por Integración**: Cada servicio expone un `IntegrationFactory` que declara su metaindata (`kind`, puerto por defecto, capacidades) y una función `create(input)`.
2. **Auto-registro al Importar**: Al cargar el módulo, la integración se registra a sí misma llamando a `registerIntegration(factory)`.
3. **Instanciación en el Bootstrap**: Al arrancar el servidor (`apps/server/src/bootstrap/integrations.ts`), se leen las instancias guardadas en SQLite y se busca la fábrica correspondiente por su `kind`.

```typescript
// Ejemplo conceptual en packages/integrations/src/sonarr/registration.ts
const factory: IntegrationFactory = {
  metadata: { kind: 'sonarr', defaultPort: 8989, displayName: 'Sonarr', capabilities: ['calendar'] },
  create(input) { return new SonarrIntegration(input); }
};
registerIntegration(factory);
```

### Por qué este patrón
Permite agregar una nueva integración (ej. Lidarr o Prowlarr) **sin modificar el código core del servidor ni de la base de datos**. Solo se añade el paquete/carpeta, se registra, y el sistema lo reconoce automáticamente.

---

## 2. Snapshot + RunLog Pattern (Gestión de Estado Asíncrono)

### El Problema
Las tareas en segundo plano que consultan APIs externas pueden fallar, demorarse o ser canceladas. Necesitamos persistir tanto el **último dato exitoso** como el **historial de intentos** para saber qué pasó sin bloquear las consultas de la UI.

### La Solución
El paquete `@dashboard/tasks` divide la persistencia en dos conceptos independientes:

- **`SnapshotStore`**: Guarda el último payload válido obtenido por una tarea (ej. los eventos de calendario). Si una tarea falla, el snapshot anterior **se conserva intacto**, garantizando que la UI nunca se quede sin datos por un fallo transitorio de la red.
- **`RunLog`**: Un registro cronológico de cada ejecución de tarea (`task_runs`), guardando la duración, el estado (`success`, `failure`, `aborted`), y la razón del error en caso de fallo.

---

## 3. ResultStatus Model (Modelo de Dos Ejes)

### El Problema
¿Cómo le informamos al cliente el estado de un servicio o dato? Un simple booleano (`success/error`) no alcanza porque mezcla dos cosas distintas: **¿tenemos el dato?** y **¿cómo salió el último intento?**

### La Solución
En `@dashboard/contracts/src/result.ts`, el estado se modela en **dos ejes independientes**:

```typescript
ResultStatus = {
  data: { obtainedAt: ISOString } | null,
  attempt: { outcome: 'success' | 'failure', at: ISOString, reason?: IntegrationErrorReason } | null
}
```

Mediante la función puramente funcional `dataViewOf(status)`, se combinan ambos ejes para derivar un veredicto claro para la UI:

| `attempt` | `data` | `dataViewOf` | Significado |
|---|---|---|---|
| `null` | — | `never-queried` | La tarea aún no corrió nunca |
| `outcome: success` | — | `fresh` | Todo en orden, dato reciente |
| `outcome: failure` | Hay dato | `outdated` | La última llamada falló, pero mostramos el último dato conocido |
| `outcome: failure` | `null` | `missing` | Falló y no hay datos previos disponibles |

### Por qué este modelo
Evita los falsos positivos de "error total" cuando una API externa parpadea 5 minutos pero el dashboard sigue mostrando el calendario gracias al último snapshot válido.

---

## 4. Capability Guard Pattern (Guardias de Capacidad)

### El Problema
Diferentes integraciones soportan distintas operaciones. Sonarr y Radarr tienen calendario (`calendar`), Jellyfin tiene lanzamientos (`mediaReleases`), Docker y Prometheus tienen métricas de sistema/salud. ¿Cómo sabe el servidor qué integraciones pueden ejecutar qué tarea o responder a qué router sin caer en jerarquías de clases rígidas o herencia múltiple profunda?

### La Solución
Se utiliza **duck-typing tipado** mediante funciones *guards* (ej. `supportsCalendar`, `supportsMediaReleases`) definidas en `packages/integrations/src/base/`.

```typescript
export function supportsCalendar(integration: Integration): integration is Integration & ICalendarIntegration {
  return typeof (integration as any).getCalendarEventsAsync === 'function';
}
```

Los routers tRPC usan estos guards en tiempo de ejecución para filtrar las instancias activas:

```typescript
const calendarIntegrations = ctx.integrations.filter(supportsCalendar);
```

### Por qué este patrón
Mantiene las clases de integración planas y desacopladas. Una integración puede implementar una, dos o ninguna capacidad de forma independiente, y el sistema se adapta dinámicamente consultando sus capacidades.

---

## Referencias Cruzadas

- Ver [architecture.md](architecture.md) para entender cómo este flujo se conecta con el monorepo.
- Ver [decisions.md](decisions.md) para conocer las alternativas descartadas al diseñar estos patrones.
- Código fuente de referencia: `packages/integrations/src/registry.ts`, `packages/contracts/src/result.ts`.
