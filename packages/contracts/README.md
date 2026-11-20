# `@dashboard/contracts`

Esquemas de validación en tiempo de ejecución y tipos de TypeScript compartidos para los datos que cruzan los límites de la aplicación. Los esquemas de Zod definen las estructuras aceptadas; los tipos inferidos mantienen el código consumidor alineado con esos esquemas.

## Áreas del contrato

- `kinds` — clases de integración, clases de servicio externo y capacidades admitidas.
- `integrations` — entradas de las integraciones, requisitos de secretos y salida pública de las integraciones.
- `calendar` — eventos del calendario y resultados del calendario por integración.
- `media-releases` — eventos de estrenos de contenido multimedia y resultados por integración.
- `download-client` — tareas de descarga y estado del cliente.
- `docker` y `docker-stats` — entradas de consulta de Docker y estructuras de respuesta.
- `system-health-types` — métricas del sistema y tipos de resultados de estado.
- `result` — datos de la instantánea y del último intento expuestos como `ResultStatus`.
- `validation` — funciones auxiliares compartidas de validación con Zod.
- `data-view` — funciones auxiliares de lectura derivada, como `dataViewOf` e `inRange`; no añaden campos al contrato de datos transmitidos.

## Estado del resultado

`ResultStatus` registra dos hechos independientes: si existen datos y cuándo se obtuvieron, y el resultado, el momento y el motivo del último intento. No los combina en una única enumeración de estado. `dataViewOf()` deriva de esos hechos una vista como `never-queried`, `fresh`, `outdated` o `missing`.

```ts
{
  data: { obtainedAt: Date } | null,
  attempt: { outcome: 'success' | 'failure' | 'aborted', at: Date, reason?: string } | null
}
```

Los resultados del calendario y de los estrenos de contenido multimedia incluyen este estado por integración. El código consumidor debe validar los datos de entrada en los límites de la aplicación con los esquemas exportados y derivar el estado de presentación con las funciones auxiliares, en lugar de inventar un contrato alternativo.

## Uso

Importa los esquemas y los tipos inferidos desde el punto de entrada del paquete:

```ts
import {
  integrationOutputSchema,
  type IntegrationOutput,
} from '@dashboard/contracts';
```

El paquete depende de Zod; no se encarga de la persistencia, los clientes de servicios ni los componentes de interfaz de usuario.
