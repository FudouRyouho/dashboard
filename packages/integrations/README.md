# `@dashboard/integrations`

Adaptadores HTTP para servicios externos. Cada integración implementa una o varias interfaces de capacidades y transforma las respuestas del servicio en los tipos compartidos de `@dashboard/contracts`.

## Integraciones admitidas

| Clase         | Capacidades                                 |
| ------------- | ------------------------------------------- |
| `sonarr`      | Calendario, estrenos de contenido multimedia |
| `radarr`      | Calendario, estrenos de contenido multimedia |
| `jellyfin`    | Estrenos de contenido multimedia            |
| `docker`      | API de Docker Engine                        |
| `prometheus`  | Métricas de estado del sistema               |
| `qbittorrent` | Cliente de descargas                        |
| `prowlarr`    | Gestión de indexadores                      |

El registro expone las factorías disponibles, los puertos predeterminados, los nombres para mostrar y las capacidades. Importar el punto de entrada del paquete también carga el módulo de registro de cada integración.

## Comportamiento compartido de las integraciones

`Integration` construye la URL base interna de las solicitudes a partir de `url` y del campo opcional `port`, utiliza un tiempo de espera predeterminado de 10 segundos para las solicitudes y obtiene los secretos necesarios de los datos de entrada de la integración. Las respuestas de los servicios que cuentan con esquemas se validan antes de transformarse en resultados del contrato. Los fallos de transporte y HTTP se clasifican como valores de `IntegrationError`.

`publicIntegration.url` toma el valor opcional de `externalUrl` cuando está configurado; en caso contrario, utiliza la URL base interna. Los metadatos públicos excluyen los secretos, pero la URL alternativa puede seguir siendo una dirección interna. Configura una URL externa cuando los clientes no deban recibir la dirección interna del servicio.

## Estructura del paquete

- `src/base/` — clase base de integración, interfaces y funciones de guarda de tipos para capacidades, y clasificación de errores.
- `src/<kind>/` — implementación específica del servicio, esquemas y registro.
- `src/registry.ts` — metadatos de integración y registro de factorías.
- `src/prometheus/` — cliente de Prometheus y normalización a métricas `PrometheusNormalized`.
- `src/qbittorrent/` — implementación de la integración con qBittorrent.
- `src/prowlarr/` — implementación de la gestión de indexadores de Prowlarr.

## Añadir una integración

1. Añade la clase y los esquemas de entrada y salida necesarios a `@dashboard/contracts`.
2. Añade la definición de presentación y el icono a `@dashboard/definitions`.
3. Implementa el adaptador del servicio y los esquemas de respuesta necesarios en `src/<kind>/`.
4. Registra una factoría con su puerto predeterminado y sus metadatos de capacidades.
5. Añade o actualiza las pruebas y los manejadores de MSW en `@dashboard/testing-utils`.
6. Actualiza la configuración de integraciones del servidor y esta guía del paquete para que reflejen el comportamiento implementado.

La conectividad con Docker depende del punto de acceso a la API del host de Docker y de sus controles de acceso. Este paquete no habilita ni expone un puerto de escucha del demonio de Docker; no presupongas que el puerto TCP 2375 está activo ni que es seguro exponerlo sin autenticación y protección del transporte.
