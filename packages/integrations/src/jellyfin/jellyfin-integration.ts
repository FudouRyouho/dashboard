import { type MediaReleaseEvent } from '@dashboard/contracts';
import { Integration } from '../base/integration';
import {
  jellyfinItemsResponseSchema,
  JellyfinItem,
} from './schemas/jellyfin-items';
import { IMediaReleasesIntegration } from '../base/media-releases';

export class JellyfinIntegration
  extends Integration
  implements IMediaReleasesIntegration {
  async getMediaReleasesAsync(options?: {
    signal?: AbortSignal;
  }): Promise<MediaReleaseEvent[]> {
    const fields = [
      'CommunityRating',
      'Studios',
      'Genres',
      'DateCreated',
      'Overview',
      'Taglines',
      'ChildCount',
      'Status',
      'IndexNumber',
      'ParentIndexNumber',
      'SeriesName',
      'SeriesId',
      'SeasonName',
      'RunTimeTicks',
      'PremiereDate',
    ].join(',');

    // Resolver userId dinámicamente (patrón Homarr: /Users → primer user)
    const usersUrl = this.url('/Users');
    const usersResponse = await this.fetchJson<{ Id: string }[]>(usersUrl, {
      headers: { 'X-Emby-Token': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });

    const userId = usersResponse[0]?.Id;
    if (!userId) {
      throw new Error('No hay usuarios en Jellyfin para resolver userId');
    }

    const url = this.url('/Items/Latest', {
      userId,
      Limit: 40,
      Fields: fields,
    });

    const rawData = await this.fetchJson<unknown>(url, {
      headers: { 'X-Emby-Token': this.getSecretValue('apiKey') },
      signal: options?.signal,
    });

    const data = jellyfinItemsResponseSchema.parse(rawData);

    return data.map((item) => this.toMediaRelease(item));
  }

  private toMediaRelease(item: JellyfinItem): MediaReleaseEvent {
    const posterTag = item.ImageTags?.['Primary'];
    const poster = posterTag
      ? this.externalUrl(`/Items/${item.Id}/Images/Primary`, {
        maxHeight: 492,
        maxWidth: 328,
        quality: 90,
        tag: posterTag,
      })
      : null;

    const backdropTag =
      item.BackdropImageTags?.[0] ?? item.ParentBackdropImageTags?.[0];
    const backdropId = item.BackdropImageTags?.length
      ? item.Id
      : item.ParentBackdropItemId;
    const backdrop =
      backdropTag && backdropId
        ? this.externalUrl(`/Items/${backdropId}/Images/Backdrop/0`, {
          maxWidth: 960,
          quality: 70,
          tag: backdropTag,
        })
        : null;

    const href = this.externalUrl(`/web/index.html#!/details`, {
      id: item.Id,
      serverId: item.ServerId,
    });

    const baseFields = {
      id: `${this.integration.id}:jellyfin:${item.Id}`,
      title: item.Name,
      description: item.Overview ?? null,
      releaseDate: item.DateCreated ?? null,
      imageUrls: { poster, backdrop },
      href,
    };

    if (item.Type === 'Movie') {
      return {
        ...baseFields,
        type: 'movie',
        runtimeMs: item.RunTimeTicks
          ? Math.round(item.RunTimeTicks / 10_000)
          : null,
        studio: item.Studios?.[0]?.Name ?? null,
        rating: item.CommunityRating ?? null,
        genres: item.Genres ?? [],
      };
    }

    if (item.Type === 'Episode') {
      return {
        ...baseFields,
        type: 'episode',
        seriesTitle: item.SeriesName,
        seriesId: item.SeriesId,
        seasonNumber: item.ParentIndexNumber,
        episodeNumber: item.IndexNumber,
      };
    }

    return {
      ...baseFields,
      type: 'series',
      firstAired: item.PremiereDate ?? null,
      childCount: item.ChildCount,
      status: item.Status ?? null,
    };
  }
}
