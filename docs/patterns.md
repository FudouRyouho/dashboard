# Patrones de diseño del monorepositorio

Estos patrones describen el registro actual de integraciones, la persistencia de tareas, el estado de los resultados y la selección por capacidades. Para conocer la distinción entre lecturas de instantáneas y llamadas en directo de cada procedimiento, véase la [arquitectura](architecture.md#3-current-query-and-mutation-paths).

## 1. Registro de integraciones

El servidor crea instancias de integración a partir de la configuración guardada en SQLite mediante fábricas registradas por el paquete de integraciones.

1. El módulo de registro de cada servicio proporciona una `IntegrationFactory` con metadatos y `create(input)`.
2. Importar el [punto de entrada del paquete](../packages/integrations/src/index.ts) carga los módulos de registro, incluidos Prowlarr y qBittorrent.
3. [`registerIntegration`](../packages/integrations/src/registry.ts) almacena las fábricas por tipo y rechaza los tipos duplicados.
4. La [inicialización del servidor](../apps/server/src/bootstrap/integrations.ts) lee las filas configuradas, valida los secretos obligatorios e instancia las fábricas correspondientes. Se omiten las filas sin una fábrica correspondiente.

El registro evita que el código de inicialización tenga que importar cada clase concreta. **No** hace que añadir una integración sea un cambio limitado a una carpeta: la incorporación también requiere los contratos, las definiciones, la importación del registro en el punto de entrada, las pruebas y la configuración del servidor pertinentes. Véase [Añadir una integración](../packages/integrations/README.md#adding-an-integration).

Los metadatos de capacidad de la fábrica describen el registro; la selección en tiempo de ejecución utiliza guardas de métodos, no esa lista de metadatos. No debe suponerse que ambos sean idénticos sin comprobar la implementación.

## 2. Snapshot + RunLog

El paquete de tareas separa los datos obtenidos correctamente del historial de intentos:

| Interfaz        | Responsabilidad                                                | Persistencia incorporada                                |
| --------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| `SnapshotStore` | Últimos datos obtenidos correctamente y momento de obtención para una clave de tarea | Consultas de instantáneas en SQLite mediante `createSnapshotStoreDB` |
| `RunLog`        | Momento, duración y resultado del intento, con causa o detalle opcionales | Consultas de ejecuciones de tareas en SQLite mediante `createRunLogDB` |

El [planificador](../packages/tasks/src/scheduler.ts) escribe una instantánea tras una ejecución correcta. Las tareas fallidas o abortadas registran un intento sin sustituir los datos anteriores. La política de fallos controla el período de espera tras fallos repetidos; la cancelación se registra como `aborted`, por separado de `failure`.

Las interfaces se inyectan, por lo que las pruebas pueden proporcionar simulaciones. Los adaptadores incorporados del servidor son almacenes persistidos en una base de datos, no cachés en memoria ni búferes circulares. Los registros antiguos, incluidas las instantáneas, están sujetos a la tarea de purga configurada. Véase la [guía del paquete de tareas](../packages/tasks/README.md) para consultar la API y la [arquitectura](architecture.md#2-scheduled-data-and-sqlite-persistence) para la configuración de retención del servidor.

Este patrón conserva los datos obtenidos previamente ante fallos transitorios de obtención, a la vez que retiene el resultado del último intento. Se aplica a los datos programados, no a todos los procedimientos de lectura: Docker combina estadísticas almacenadas del panel con una lista de contenedores obtenida en directo, mientras que las descargas y el estado del sistema usan llamadas directas a las integraciones.

## 3. Estado del resultado en dos ejes

[`ResultStatus`](../packages/contracts/src/result.ts) mantiene separadas la disponibilidad de los datos y el resultado del intento. Su estructura de transmisión es:

```typescript
type ResultStatus = {
  data: {
    obtainedAt: string; // ISO datetime
    from: string | null;
    to: string | null;
  } | null;
  attempt:
    | { outcome: 'success'; at: string }
    | { outcome: 'failure'; at: string; reason: IntegrationErrorReason }
    | null;
};
```

[`dataViewOf`](../packages/contracts/src/data-view.ts) deriva una etiqueta sin añadir una enumeración de estados al contrato de transmisión:

| Último intento | Datos    | Vista derivada    |
| -------------- | ------- | --------------- |
| `null`         | Con o sin datos | `never-queried` |
| `success`      | Con o sin datos | `fresh`         |
| `failure`      | Presentes | `outdated`      |
| `failure`      | `null`  | `missing`       |

Estas etiquetas reflejan el resultado del intento y la presencia de datos, **no un cálculo de tiempo de vida**. En particular, `fresh` no demuestra que una marca temporal sea reciente, y la ausencia de un intento produce `never-queried` aunque exista una instantánea.

La función [`toStatus`](../apps/server/src/tasks/to-status.ts) del servidor convierte la información de la instantánea y la ejecución a este contrato. Suprime el intento si la instantánea proporcionada carece de ID de tarea o tiene un ID de tarea distinto al de la ejecución. Una ejecución no satisfactoria, incluida `aborted`, se convierte en un intento fallido con su causa o `unknown`. Los campos de cobertura se leen del nivel superior del objeto de instantánea y su valor predeterminado es `null`; esta función auxiliar no extrae la cobertura de un contenido anidado.

## 4. Guardas de capacidad

Las clases de integración exponen métodos de capacidad independientes en lugar de exigir una jerarquía de herencia profunda. Las guardas de los [módulos base de integración](../packages/integrations/src/base/calendar.ts) acotan el tipo según la presencia de métodos. Por ejemplo, la guarda de calendario comprueba la existencia de `getCalendarEventsAsync`:

```typescript
const calendarIntegrations = ctx.integrations.filter(supportsCalendar);
```

Los enrutadores y el constructor de definiciones de tareas del servidor usan estas guardas para seleccionar las instancias aptas. Calendario, lanzamientos multimedia, Docker, descargas, estado del sistema y gestión de indexadores tienen interfaces de capacidad separadas.

Una guarda comprueba la presencia de determinados métodos, no la validez de las respuestas ni la disponibilidad del servicio remoto. Por ejemplo, `supportsDocker` comprueba los métodos de estadísticas del panel y de mutación, no todos los métodos de Docker; `supportsSystemHealth` comprueba `getSystemMetricsAsync`. La validación de las respuestas del servicio y la clasificación de errores siguen siendo responsabilidad de los adaptadores. Los metadatos de capacidad por sí solos no constituyen una validación en tiempo de ejecución.

## Verificación y referencias

- [Guía de pruebas](TESTING.md) — convenciones para probar guardas, límites de integración y comportamiento de los estados.
- [Utilidades de pruebas](../packages/testing-utils/README.md) — simulaciones, datos de prueba y manejadores HTTP disponibles; los contextos simulados no proporcionan una base de datos real de forma predeterminada.
- [Arquitectura](architecture.md) — responsabilidades de los paquetes, composición del servidor y rutas de consulta actuales.
- [Decisiones técnicas](decisions.md) — justificación y contexto histórico. Su historial de Prowlarr no indica una limitación pendiente: la integración está exportada y registrada actualmente.
