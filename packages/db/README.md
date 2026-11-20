# `@dashboard/db`

Capa de persistencia SQLite implementada con Drizzle ORM y `better-sqlite3`. Gestiona el esquema de la base de datos, las migraciones y las funciones de consulta que utilizan el servidor y los adaptadores de tareas.

## API pública

- `createConnection(path)` abre una conexión a la base de datos y devuelve el objeto de conexión tipado `DB` de Drizzle. No ejecuta migraciones.
- `initializeDatabase({ path, migrationsFolder? })` abre la base de datos y aplica las migraciones. El directorio de migraciones predeterminado es la carpeta de migraciones del paquete.
- `connect(path)` crea el directorio padre cuando es necesario y, a continuación, inicializa la base de datos y aplica las migraciones.
- `runMigrations(db, migrationsFolder?)` aplica las migraciones a una conexión existente.
- `schemas/` y `queries/` exponen el esquema y las funciones de consulta preparadas a través del punto de entrada del paquete.

`@dashboard/db` no declara scripts de paquete para generar migraciones, ejecutar un comando de migración por CLI ni abrir una herramienta de exploración del esquema. Utiliza las funciones públicas de inicialización desde el código; no dependas de comandos `pnpm --filter @dashboard/db` sin documentar.

## Áreas de almacenamiento

Los módulos de esquema y consultas abarcan la configuración de integraciones, las políticas de tareas, las instantáneas de tareas y el historial de ejecuciones. Las instantáneas son registros serializados como JSON y las ejecuciones de tareas se almacenan como filas; la tarea de purga de la capa de tareas realiza la limpieza según la política de retención.

## Dependencias y pruebas

El paquete utiliza Drizzle ORM y `better-sqlite3`. Las pruebas del repositorio comprueban el comportamiento de las consultas y las migraciones; ejecútalas desde la raíz del espacio de trabajo con `pnpm test`. Las pruebas que utilizan bases de datos deben usar bases de datos desechables y limpiar sus archivos.
