# references/responses

Respuestas de las APIs externas, guardadas para escribir schemas contra algo
concreto en vez de contra la memoria.

**Hay dos clases de archivo y no valen lo mismo.** El sufijo lo dice:

| sufijo | qué es | qué se puede concluir |
|---|---|---|
| `.openapi-example.json` | el *Example Value* de la documentación OpenAPI del proveedor | **la forma**: qué campos existen, cuáles el proveedor declara nullable |
| `.captured.json` | una respuesta real, traída con `curl` de un servicio propio | **los valores**: qué llega de verdad en este despliegue |

## Lo que hay hoy

- `sonarr-calendar-v3.openapi-example.json`
- `radarr-calendar-v3.openapi-example.json`
- `jellyfin-items-latest.captured.json` — **la primera de la segunda clase.**
  `GET /Items/Latest?userId=…&Limit=40&Fields=CommunityRating,Studios,PremiereDate,Genres,ChildCount,DateCreated,Overview,Taglines`
  contra Jellyfin 10.11.11 (`DESKTOP-B5SN0AO`), 2026-08-31, con `X-Emby-Token`.
  40 items: 30 `Series`, 9 `Episode`, 1 `Movie`. Lleva nombres de la biblioteca
  real, que es justamente lo que la hace útil como mock.

  Lo que estableció, y que el ejemplo de OpenAPI no podía: doce campos presentes
  en los 40 y nunca `null` (`Id`, `Name`, `ServerId`, `Type`, `Overview`,
  `PremiereDate`, `DateCreated`, `Genres`, `Studios`, `Taglines`, `RunTimeTicks`,
  `ProductionYear`), contra un `BaseItemDto` que declara los trece opcionales.
  El único genuinamente ausente es `CommunityRating` — falta en los 9 `Episode`,
  en el único `Movie` y en 2 de 30 `Series`.

Los dos son de la primera clase. Se ve a simple vista: todos los ids en `1`,
todos los strings en `null` o `"string"`, un solo elemento en el array, y cuatro
apariciones del literal `[Max Depth Exceeded]`, que es el marcador del generador
de ejemplos de Swagger UI.

**No hay ningún archivo de la segunda clase todavía.**

## Por qué la distinción importa

El schema de `packages/integrations/src/sonarr/schemas/sonarr-calendar.ts` **no
parsea** el ejemplo de acá: falla en `title`, `series.title`, `series.titleSlug`
y `images[].remoteUrl`, que la doc declara nullable y el schema exige.

Eso no es un error del schema: se escribió contra lo que devuelve el servidor
real, y ahí esos campos vienen. Es la validación progresiva funcionando. Pero
muestra para qué sirve cada archivo — el ejemplo dice qué **podría** llegar, la
captura dice qué **llega**. Escribir un schema mirando sólo uno de los dos deja
un flanco abierto.

Y hay un campo donde el flanco no avisa: `airDateUtc: z.coerce.date()` acepta
`null` y lo convierte en `1970-01-01`, sin `ZodError` — porque `new Date(null)`
es epoch. Es el único campo del schema que no falló contra este ejemplo, y no
falló por silenciar.

## Al capturar una respuesta nueva

Guardarla como `<servicio>-<endpoint>-<version>.captured.json`, sin editarla a
mano. Si trae algo sensible —api keys en una URL, rutas de disco, nombres de
archivo— reemplazarlo, y dejar dicho que se reemplazó.
