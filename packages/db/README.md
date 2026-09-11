# @dashboard/db

Capa de acceso a datos con drizzle y better-sqlite3.
Esquemas, migraciones y consultas preparadas.

## Estructura

- `src/connection.ts` — creación de conexión y tipo `DB`
- `src/bootstrap.ts` — inicialización de la base de datos y configuración
- `src/migrate.ts` — ejecución de migraciones
- `src/schemas/` — esquemas de drizzle para tablas (tasks, server-logs, integrations)
- `src/queries/` — consultas preparadas para operaciones comunes (task-runs, task-snapshots)
- `src/index.ts` — reexporta todo lo necesario para usar la capa de datos

## Uso

Este paquete proporciona una capa de abstracción sobre la base de datos SQLite mediante drizzle-orm.
Incluye funcionalidades para:

1. Conexión y configuración de la base de datos
2. Migraciones de esquema
3. Consultas preparadas para operaciones frecuentes
4. Tipos seguros para interactuar con los datos

### Generar migraciones

```bash
pnpm --filter @dashboard/db generate
```

### Ejecutar migraciones

```bash
pnpm --filter @dashboard/db migrate
```

### Ver el esquema

```bash
pnpm --filter @dashboard/db studio
```
