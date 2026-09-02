# @dashboard/tasks

Tareas programadas, ejecuta funciones cada x tiempo, guarda el ultimo "estado del dato" o de la tarea.

| Librería         | Qué resuelve                                    |
| ---------------- | ----------------------------------------------- |
| `toad-scheduler` | los timers y el solapamiento (`preventOverrun`) |
| `p-queue`        | el techo de corridas simultáneas del proceso    |

## Estructura

- `types.ts` — `TaskDefinition`, `TaskRun`, `FailurePolicy`, `TaskPolicy`
- `store.ts` — `SnapshotKey<T>` y el almacén en memoria
- `run-log.ts` — anillo de corridas por tarea
- `scheduler.ts` — el motor: arma un job por definición y devuelve `stop()`

## Una corrida

1. El timer dispara. Si el proceso está parando, o la tarea está en cooldown,
   no arranca.
2. Se crea un `AbortController` propio de esa corrida.
3. El trabajo entra a la cola; corre cuando hay lugar bajo el techo de
   concurrencia.
4. Sale bien → escribe el almacén, borra el contador de fallos, registra
   `success`.
5. Sale mal → clasifica el error, suma un fallo y, si llegó a `maxAttempts`,
   fija el cooldown.
6. Fue cancelada → registra `aborted`, que **no** cuenta como fallo.

## Lo que fijan los tests

- una tarea no corre dos veces a la vez
- sólo el éxito escribe el almacén
- `stop()` cancela lo que está en vuelo y lo marca `aborted`, no `failure`
- el límite de concurrencia acota las corridas simultáneas
- tras `maxAttempts` fallos seguidos, la tarea espera el cooldown
- un éxito borra el contador de fallos

> [!NOTE]
> **`SnapshotKey<T>` lleva el tipo del dato en la clave.** El campo `__data?: T` no existe en runtime: sólo hace que `store.set(key, data)` y `store.get(key)` hablen del mismo tipo sin castear en cada lectura.
> **El anillo de corridas devuelve una copia** (`forTask`): mutar lo que sale no toca el historial.
> **El almacén es memoria.** Se pierde en cada reinicio; el primer request después de arrancar ve `never-queried` hasta que corra la tarea.
> **`aborted` no es `failure`.** Apagar el server no debe empujar una tarea sana al cooldown.
