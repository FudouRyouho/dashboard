# `@dashboard/tasks`

Planificador de trabajo periódico, con interfaces tipadas para instantáneas e historial de ejecuciones, además de adaptadores con persistencia en SQLite para el servidor.

## API pública

- `TaskDefinition`, `TaskPolicy`, `FailurePolicy`, `TaskRun`, `Snapshot`, `SnapshotKey`, `SnapshotStore` y `RunLog` describen las tareas y sus resultados.
- `createScheduler(definitions, options)` programa las definiciones, aplica las políticas de concurrencia y fallos, y devuelve un planificador con `stop()`.
- `createSnapshotStoreDB(db)` adapta las consultas de instantáneas de `@dashboard/db` a `SnapshotStore`.
- `createRunLogDB(db)` adapta las consultas de ejecuciones de `@dashboard/db` a `RunLog`.
- `createPurgeTask({ db, daysToKeep, logger? })` crea una tarea que elimina los registros antiguos del historial de ejecuciones y de instantáneas.

El planificador recibe sus interfaces de almacenamiento del código que lo invoca; no crea una base de datos. Los adaptadores de base de datos integrados almacenan las instantáneas y el historial de ejecuciones en SQLite. No son almacenes en memoria ni búferes circulares.

## Ciclo de vida de las tareas

Una definición proporciona su intervalo, si se ejecuta al inicio, la duración prevista, la política de fallos y el trabajo asíncrono que recibe un `AbortSignal`. Las ejecuciones se registran como `success`, `failure` o `aborted`. El planificador encola el trabajo hasta el límite de concurrencia configurado y aplica el periodo de espera configurado tras fallos repetidos. La cancelación se registra por separado del fallo.

`createPurgeTask` se ejecuta inmediatamente y, después, a diario. El código que lo invoca elige el periodo de retención mediante `daysToKeep`; la tarea elimina tanto las ejecuciones antiguas como las instantáneas antiguas y devuelve el número de registros eliminados.

## Dependencias y pruebas

`@dashboard/tasks` depende de `@dashboard/db` para sus adaptadores de SQLite, y de `toad-scheduler` y `p-queue` para la planificación y la concurrencia. El comportamiento del planificador está cubierto por las pruebas unitarias y las pruebas con base de datos del paquete; ejecuta la suite del repositorio con `pnpm test` desde la raíz del espacio de trabajo.
