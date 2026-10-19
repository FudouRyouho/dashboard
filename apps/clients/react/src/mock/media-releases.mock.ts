import type { MediaReleaseEvent } from '@dashboard/contracts';

export const mediaReleasesMock: MediaReleaseEvent[] = [
  {
    type: 'movie',
    id: 'radarr:movie:101',
    title: 'Spider-Man: Beyond the Spider-Verse',
    description:
      'Miles Morales viaja a través del multiverso junto a Gwen Stacy y un nuevo equipo de Spider-People para enfrentarse a un villano más poderoso que cualquier amenaza que hayan conocido.',
    releaseDate: '2026-09-15T00:00:00.000Z',
    runtimeMs: 8400000, // 140 min
    studio: 'Columbia Pictures / Sony Pictures Animation',
    rating: 8.9,
    genres: ['Animación', 'Acción', 'Aventura', 'Ciencia Ficción'],
    imageUrls: {
      poster: 'https://artworks.thetvdb.com/banners/v4/movie/14713/posters/62a8c3d8c1e2b.jpg',
      backdrop: 'https://artworks.thetvdb.com/banners/v4/movie/14713/backgrounds/62a8c3d8c1e2b.jpg',
    },
    href: 'http://192.168.10.197:7878/movie/spider-man-beyond-the-spider-verse',
  },
  {
    type: 'episode',
    id: 'sonarr:episode:201',
    title: 'La Niebla del Tiempo',
    seriesTitle: 'Frieren: Más allá del final del viaje',
    seriesId: 'sonarr:series:55',
    seasonNumber: 2,
    episodeNumber: 4,
    description:
      'Frieren y su grupo se adentran en la meseta norteña en busca de información sobre los antiguos hechiceros mientras lidian con bestias mágicas.',
    releaseDate: '2026-10-18T14:00:00.000Z',
    imageUrls: {
      poster: 'https://artworks.thetvdb.com/banners/v4/series/424109/posters/651d5c228a472.jpg',
      backdrop: 'https://artworks.thetvdb.com/banners/v4/series/424109/backgrounds/651d5c228a472.jpg',
    },
    href: 'http://192.168.10.197:8989/series/frieren-beyond-journeys-end',
  },
  {
    type: 'series',
    id: 'jellyfin:series:301',
    title: 'Cyberpunk: Edgerunners 2',
    description:
      'Una nueva historia situada en las oscuras y peligrosas calles de Night City, explorando el costo humano del ciberware y la obsesión por la gloria.',
    releaseDate: '2026-10-01T00:00:00.000Z',
    firstAired: '2026-10-01T00:00:00.000Z',
    childCount: 10,
    status: 'Continuing',
    imageUrls: {
      poster: 'https://artworks.thetvdb.com/banners/v4/series/414578/posters/6320579e4316d.jpg',
      backdrop: 'https://artworks.thetvdb.com/banners/v4/series/414578/backgrounds/6320579e4316d.jpg',
    },
    href: 'http://192.168.10.125:8096/web/index.html#!/details?id=301',
  },
];
