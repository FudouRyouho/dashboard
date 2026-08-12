import { Integration } from "../base/integration";
import type {
  CalendarEvent,
  ICalendarIntegration,
} from "../contracts/calendar";
import {
    sonarrCalendarResponseSchema,
} from "./schemas/sonarr-calendar";
export class SonarrIntegration extends Integration
    implements ICalendarIntegration {
    private apiKey(): string {
        return this.getSecretValue("apiKey");
    }

    private readonly DEFAULT_PORT = 8989;

    public async getSeries(): Promise<Array<{ id: number; title: string }>> {
        const path = this.createUrl(
            this.integration.url,
            "/api/v3/series",
            this.integration.port ?? this.DEFAULT_PORT
        );
        const data = await this.fetchJson<any[]>(path, {
            headers: {
                "X-Api-Key": this.apiKey(),
            },
        });
        return data.map((s) => ({ id: s.id, title: s.title }));
    }

    async getCalendarEventsAsync(
        start: Date,
        end: Date,
    ): Promise<CalendarEvent[]> {
        const url = this.url("/api/v3/calendar", {
            start,
            end,
            unmonitored: true,
            includeSeries: true,
            includeEpisodeFile: true,
            includeEpisodeImages: true,
        });

        const rawData = await this.fetchJson<unknown>(url, {
            headers: {
                "X-Api-Key": this.getSecretValue("apiKey"),
            },
        });

        const data = sonarrCalendarResponseSchema.parse(rawData);

        return data.map((episode) => {
            const imageUrl =
                episode.series.images[0]?.remoteUrl ?? null;

            return {
                id: `${this.integration.id}:episode:${episode.id}`,

                title: episode.title,
                subtitle: episode.series.title,
                description: episode.series.overview ?? null,

                startDate: episode.airDateUtc.toISOString(),
                endDate: null,

                image: imageUrl
                    ? {
                        src: imageUrl,
                        aspectRatio: {
                            width: 7,
                            height: 12,
                        },
                        badge: {
                            content: `S${episode.seasonNumber}/E${episode.episodeNumber}`,
                            color: "red",
                        },
                    }
                    : null,

                location: null,

                metadata: {
                    type: "episode",
                    seriesId: episode.series.id,
                    seasonNumber: episode.seasonNumber,
                    episodeNumber: episode.episodeNumber,
                },

                indicatorColor: "blue",

                links: [
                    {
                        name: "Sonarr",
                        href: this.url(
                            `/series/${episode.series.titleSlug}`,
                        ),
                        isDark: true,
                    },
                ],
            };
        });
    }
}