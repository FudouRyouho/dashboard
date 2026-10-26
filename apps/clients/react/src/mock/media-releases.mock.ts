import type { MediaReleaseEvent, ResultStatus } from '@dashboard/contracts';

import type { MediaReleasesGroupProps } from '../sections/media-releases/types';

/** Every group stands for the same thing: a snapshot task that ran and got data. */
const SNAPSHOT: ResultStatus = {
  data: {
    obtainedAt: '2026-10-19T12:00:00.000Z',
    from: '2026-10-12T00:00:00.000Z',
    to: '2026-10-26T00:00:00.000Z',
  },
  attempt: { outcome: 'success', at: '2026-10-19T12:00:00.000Z' },
};

/** Releases the Sonarr instance would emit (id prefix `sonarr:`). */
const sonarrReleases: MediaReleaseEvent[] = [
  {
    type: 'episode',
    id: 'sonarr:episode:15841',
    title: 'THE BLADE',
    seriesTitle: 'Bleach',
    seriesId: 'sonarr:series:136',
    seasonNumber: 17,
    episodeNumber: 41,
    description:
      'For as long as he can remember, Ichigo Kurosaki has been able to see ghosts. But when he meets Rukia, a Soul Reaper who battles evil spirits known as Hollows, he finds his life is changed forever when Rukia transfers most of her powers to him.',
    releaseDate: '2026-10-19T14:00:00.000Z',
    runtimeMs: null, // Sonarr/Radarr solo tienen capability 'calendar'; no proveen runtimeMs a mediaReleases
    genres: ['Action', 'Adventure', 'Animation', 'Anime', 'Fantasy', 'Martial Arts'],
    imageUrls: {
      poster:
        'https://artworks.thetvdb.com/banners/posters/74796-3.jpg',
      backdrop:
        'https://artworks.thetvdb.com/banners/graphical/74796-g6.jpg',
    },
    href: 'http://192.168.10.197:8989/series/bleach',
  },
  {
    type: 'episode',
    id: 'sonarr:episode:6193',
    title: 'Last Chance for a Slow Dance',
    seriesTitle: 'Cyberpunk: Edgerunners',
    seriesId: 'sonarr:series:162',
    seasonNumber: 1,
    episodeNumber: 1,
    description:
      'David Martinez, un estudiante de secundaria, se ve forzado a robar un ciberware de alta gama para pagar las facturas médicas de su madre.',
    releaseDate: '2026-10-20T20:00:00.000Z',
    runtimeMs: null, // Sonarr/Radarr solo tienen capability 'calendar'; no proveen runtimeMs a mediaReleases
    genres: ['Animation', 'Action', 'Adventure', 'Sci-Fi', 'Drama'],
    imageUrls: {
      poster:
        'https://artworks.thetvdb.com/banners/series/384541/posters/5ef503b89742f.jpg',
      backdrop:
        'https://artworks.thetvdb.com/banners/v4/series/384541/banners/633481a4256af.jpg',
    },
    href: 'http://192.168.10.197:8989/series/cyberpunk-edgerunners',
  },
];

/** Releases the Radarr instance would emit (id prefix `radarr:`). */
const radarrReleases: MediaReleaseEvent[] = [
  {
    type: 'movie',
    id: 'radarr:movie:82',
    title: 'Avatar: Aang, El último Maestro Aire',
    description:
      'Aang, el último Maestro Aire sobrevive a un ataque a su templo y despierta cien años después, donde el mundo ha sido destruido por la guerra del Fuego.',
    releaseDate: '2026-07-24T00:00:00.000Z',
    runtimeMs: 1_740_000_000, // ~290 min
    studio: 'Paramount Pictures / Nickelodeon',
    rating: 8.1,
    genres: ['Animación', 'Aventura', 'Acción', 'Fantasía'],
    imageUrls: {
      poster:
        'https://image.tmdb.org/t/p/original/3sgnSfNT27Bx5O5ukr7B26mhEQq.jpg',
      backdrop:
        'https://image.tmdb.org/t/p/original/ezbrL1dMymKQZw7mDEWa2ZTzN7d.jpg',
    },
    href: 'http://192.168.10.197:7878/movie/avatar-aang-el-ultimo-maestro-aire',
  },
];

/** Releases the Jellyfin instance would emit (id prefix `jellyfin:`). */
const jellyfinReleases: MediaReleaseEvent[] = [
  {
    type: 'series',
    id: 'jellyfin:series:3c439490c8eccafcea6a492ecef6c2b8',
    title: 'Daemons of the Shadow Realm',
    description:
      'In a remote mountain village under the watchful eyes of two stone guardians, the young Yuru contentedly lives off the land while staying close to the only family he has left—Asa, his precious twin sister.',
    releaseDate: '2026-04-04T03:00:00.000Z',
    firstAired: '2026-04-04T03:00:00.000Z',
    childCount: 12,
    status: 'Continuing',
    studio: 'bones film',
    rating: 7.8,
    genres: ['Action', 'Adventure', 'Anime', 'Comedy', 'Fantasy'],
    imageUrls: {
      poster:
        'http://192.168.10.125:8096/Items/3c439490c8eccafcea6a492ecef6c2b8/Images/Primary?maxHeight=492&quality=90',
      backdrop: null,
    },
    href: 'http://192.168.10.125:8096/web/index.html#!/details?id=3c439490c8eccafcea6a492ecef6c2b8',
  },
];

/**
 * One entry per media-releases integration, matching the real
 * `mediaReleases.getLatest` shape: `{ integration, status, releases }`.
 * Group order keeps the order the old flat list had by source (radarr, sonarr,
 * jellyfin) and the ids/names match `integrations.mock`; card data is unchanged.
 */
export const mediaReleasesMock: MediaReleasesGroupProps[] = [
  {
    integration: { id: 'radarr-main', kind: 'radarr', name: 'Radarr (Películas)', url: 'http://192.168.10.197:7878' },
    status: SNAPSHOT,
    releases: radarrReleases,
  },
  {
    integration: { id: 'sonarr-main', kind: 'sonarr', name: 'Sonarr (Series)', url: 'http://192.168.10.197:8989' },
    status: SNAPSHOT,
    releases: sonarrReleases,
  },
  {
    integration: { id: 'jellyfin-main', kind: 'jellyfin', name: 'Jellyfin (Media Server)', url: 'http://192.168.10.125:8096' },
    status: SNAPSHOT,
    releases: jellyfinReleases,
  },
];
