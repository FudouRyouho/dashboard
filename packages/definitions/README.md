# `@dashboard/definitions`

Catálogos de presentación independientes del framework, compartidos por el panel y sus clientes. Las clases del dominio y sus tipos de TypeScript provienen de `@dashboard/contracts`.

## Catálogos

- `integrationDefs` asocia cada `IntegrationKind` con su nombre para mostrar, URL del icono, color de marca e indicador de contraste de color.
- `externalServiceDefs` asocia las clases de servicio externo con metadatos de presentación.
- `mediaTypeDefs` y `mediaTypeColor(type)` asocian los tipos de estrenos de contenido multimedia con colores de etiquetas; las cadenas desconocidas usan `#94a3b8` como valor predeterminado.

El mapa de integraciones se comprueba con `Record<IntegrationKind, IntegrationDef>`, por lo que añadir una clase al contrato requiere una definición correspondiente. Lo mismo se aplica a las clases de servicio externo y a los tipos de estrenos de contenido multimedia.

## Iconos

Los recursos SVG se encuentran en `packages/definitions/icons/`. Las definiciones de integración utilizan URL con el formato `/icons/<name>.svg`; el servidor publica estos recursos bajo `/icons/`. Mantén alineados los nombres de archivo de los iconos y las URL de las definiciones.

## Dependencias

Este paquete depende de `@dashboard/contracts` para sus tipos de clases y de estrenos de contenido multimedia. No depende de ningún framework de interfaz de usuario.
