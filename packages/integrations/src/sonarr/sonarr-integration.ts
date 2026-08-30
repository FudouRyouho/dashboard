import { type CalendarEvent } from '@dashboard/contracts';
import { Integration } from '../base/integration';
import { aspectRatioByCoverType, chooseBestImage } from '../image';
import { sonarrCalendarResponseSchema } from './schemas/sonarr-calendar';
import { ICalendarIntegration } from '../base/calendar';

export class SonarrIntegration
  extends Integration
  implements ICalendarIntegration
{
  async getCalendarEventsAsync(
    start: Date,
    end: Date,
    includeUnmonitored: boolean,
    options?: { signal?: AbortSignal },
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
      headers: { 'X-Api-Key': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });

    const data = sonarrCalendarResponseSchema.parse(rawData);

    return data.map((event) => {
      const bestImage = chooseBestImage([
        ...event.images,
        ...event.series.images,
      ]);
      return {
        id: `${this.integration.id}:episode:${event.id}`,
        title: event.title,
        subtitle: event.series.title,
        description: event.series.overview ?? null,
        startDate: event.airDateUtc.toISOString(),
        endDate: null,
        image: bestImage?.remoteUrl
          ? {
              src: bestImage.remoteUrl,
              aspectRatio: aspectRatioByCoverType[bestImage.coverType],
              badge: {
                content: `S${event.seasonNumber}/E${event.episodeNumber}`,
                color: 'red',
              },
            }
          : null,
        location: null,
        metadata: {
          type: 'episode',
          seriesId: event.series.id,
          seasonNumber: event.seasonNumber,
          episodeNumber: event.episodeNumber,
        },
        indicatorColor: 'blue',
        links: [
          {
            name: 'Sonarr',
            href: this.externalUrl(`/series/${event.series.titleSlug}`),
            isDark: true,
          },
        ],
      };
    });
  }
}
