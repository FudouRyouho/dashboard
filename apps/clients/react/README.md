# @dashboard/client-react

Cliente web del dashboard. Vite 8 + React 19 + Mantine 9.

    pnpm --filter @dashboard/client-react dev
    pnpm --filter @dashboard/client-react typecheck
    pnpm --filter @dashboard/client-react lint

## Estado

UI sobre **mock data** (`src/mock/`). Todavía no hay fetch contra
`apps/server`: el mock tipa contra el contrato real, así que la capa
presentacional ya está escrita contra la forma definitiva de los datos.

## Estructura

- `shell/` — layout: header, tabs, cambio de tema
- `sections/` — una carpeta por sección del dashboard
- `mock/` — datos de prueba, tipados contra `@dashboard/integrations`
- `theme.ts` — tema de Mantine

## Lo que no es obvio

- **`tsconfig.json` está aislado del de la raíz.** El `typecheck` de la raíz
  excluye `apps/clients/**`; este paquete corre el suyo. El `"exclude": []`
  no es cosmético: sin él hereda el exclude de la raíz y se excluye a sí mismo.
- **`import type` vs import normal.** Un `import type` se borra al compilar y
  Vite nunca lo ve. Si importás un *valor* de un paquete del workspace, tiene
  que estar en `dependencies` o Vite no lo resuelve en runtime.
- **Fechas.** `renderDay` de `@mantine/dates` entrega `"YYYY-MM-DD"` (string,
  no `Date`), y `new Date("YYYY-MM-DD")` parsea como **UTC**, no local. Es el
  origen de los bugs de "un día corrido" que ya aparecieron dos veces acá.
