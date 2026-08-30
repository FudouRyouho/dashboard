# @dashboard/contracts

La forma de los datos que cruzan el límite servidor ↔ cliente, y nada más.
Schemas de Zod, los tipos que salen de ellos y las funciones que **leen** ese
contrato sin agregarle campos.

## Estructura

- `kinds.ts` — `integrationKinds` y el tipo `IntegrationKind`
- `calendar.ts` — evento, imagen, links, metadata y el grupo por integración
- `result.ts` — `ResultStatus`: los hechos del último intento
- `data-view.ts` — `dataViewOf` y `inRange`: lectura derivada, no contrato

## `ResultStatus`: dos ejes, no un enum

El server manda **hechos**, no un veredicto: por un lado si hay dato y de
cuándo es, por el otro cómo salió el último intento.

    { data: { obtainedAt } | null, attempt: { outcome, at, reason? } | null }

`dataViewOf()` cruza los dos ejes y devuelve el veredicto. La tabla completa:

| `attempt`           | `data`  | `dataViewOf`  |
| ------------------- | ------- | ------------  |
| `null`              | —       | never-queried |
| `outcome: success`  | —       | fresh         |
| `outcome: failure`  | hay     | outdated      |
| `outcome: failure`  | `null`  | missing       |
