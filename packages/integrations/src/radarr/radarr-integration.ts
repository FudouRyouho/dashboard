import { type CalendarEvent } from '@dashboard/contracts';
import { Integration } from '../base/integration';
import { aspectRatioByCoverType, chooseBestImage } from '../image';
import {
  radarrCalendarResponseSchema,
  radarrReleaseTypes,
} from './schemas/radarr-calendar';
import { ICalendarIntegration } from '../base/calendar';

export class RadarrIntegration
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
    });

    const rawData = await this.fetchJson<unknown>(url, {
      headers: { 'X-Api-Key': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });

    const data = radarrCalendarResponseSchema.parse(rawData);

    return data.flatMap((event) => {
      const bestImage = chooseBestImage([...event.images]);

      return radarrReleaseTypes.flatMap((releaseType) => {
        const date = event[releaseType];
        if (!date) return [];

        return [
          {
            id: `${this.integration.id}:movie:${event.id}:${releaseType}`,
            title: event.title,
            subtitle: event.originalTitle,
            description: event.overview ?? null,
            startDate: date.toISOString(),
            endDate: null,
            image: bestImage?.remoteUrl
              ? {
                  src: bestImage.remoteUrl,
                  aspectRatio: aspectRatioByCoverType[bestImage.coverType],
                  badge: {
                    content: `${event.id}`,
                    color: 'violet',
                  },
                }
              : null,
            location: null,
            metadata: {
              type: 'movie',
              movieId: event.id,
              releaseType,
            },
            indicatorColor: 'yellow',
            links: [
              {
                name: 'Radarr',
                href: this.externalUrl(`/movie/${event.titleSlug}`),
                isDark: false,
              },
            ],
          },
        ];
      });
    });
  }
}
