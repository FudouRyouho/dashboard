import { Integration } from '../base/integration';
import type {
  CalendarEvent,
  ICalendarIntegration,
} from '../contracts/calendar';
import {
  sonarrCalendarResponseSchema,
  imageCoverTypes,
  type SonarrImage,
  type SonarrCoverType,
} from './schemas/sonarr-calendar';
import { sonarrSeriesListResponseSchema } from './schemas/sonarr-series';

const aspectRatioByCoverType: Record<
  SonarrCoverType,
  { width: number; height: number }
> = {
  poster: { width: 2, height: 3 },
  banner: { width: 758, height: 140 },
  fanart: { width: 16, height: 9 },
  screenshot: { width: 16, height: 9 },
  clearlogo: { width: 16, height: 9 },
  headshot: { width: 1, height: 1 },
  unknown: { width: 2, height: 3 },
};

const chooseBestImage = (images: SonarrImage[]): SonarrImage | undefined =>
  [...images]
    .filter((image) => image.remoteUrl)
    .sort(
      (a, b) =>
        imageCoverTypes.indexOf(a.coverType) -
        imageCoverTypes.indexOf(b.coverType),
    )[0];

export class SonarrIntegration
  extends Integration
  implements ICalendarIntegration
{
  public async getSeries(): Promise<{ id: number; title: string }[]> {
    const path = this.url('/api/v3/series');
    const rawData = await this.fetchJson<unknown>(path, {
      headers: {
        'X-Api-Key': this.apiKey(),
      },
    });
    const data = sonarrSeriesListResponseSchema.parse(rawData);
    return data.map((s) => ({ id: s.id, title: s.title }));
  }

  async getCalendarEventsAsync(
    start: Date,
    end: Date,
    includeUnmonitored = false,
  ): Promise<CalendarEvent[]> {
    const url = this.url('/api/v3/calendar', {
      start,
      end,
      unmonitored: includeUnmonitored,
      includeSeries: true,
      includeEpisodeFile: true,
      includeEpisodeImages: true,
    });

    const rawData = await this.fetchJson<unknown>(url, {
      headers: {
        'X-Api-Key': this.getSecretValue('apiKey'),
      },
    });

    const data = sonarrCalendarResponseSchema.parse(rawData);

    return data.map((episode) => {
      const bestImage = chooseBestImage([
        ...episode.images,
        ...episode.series.images,
      ]);

      return {
        id: `${this.integration.id}:episode:${episode.id}`,

        title: episode.title,
        subtitle: episode.series.title,
        description: episode.series.overview ?? null,

        startDate: episode.airDateUtc.toISOString(),
        endDate: null,

        image: bestImage?.remoteUrl
          ? {
              src: bestImage.remoteUrl,
              aspectRatio: aspectRatioByCoverType[bestImage.coverType],
              badge: {
                content: `S${episode.seasonNumber}/E${episode.episodeNumber}`,
                color: 'red',
              },
            }
          : null,

        location: null,

        metadata: {
          type: 'episode',
          seriesId: episode.series.id,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
        },

        indicatorColor: 'blue',

        links: [
          {
            name: 'Sonarr',
            href: this.externalUrl(`/series/${episode.series.titleSlug}`),
            isDark: true,
          },
        ],
      };
    });
  }

  private apiKey(): string {
    return this.getSecretValue('apiKey');
  }
}
