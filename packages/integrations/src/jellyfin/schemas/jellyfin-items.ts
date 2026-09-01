import { z } from 'zod'

const nameIdPairSchema = z.object({ Name: z.string(), Id: z.string() });

const studioSchema = nameIdPairSchema;

const userDataSchema = z.object({
    UnplayedItemCount: z.number().optional(),
    PlaybackPositionTicks: z.number(),
    PlayCount: z.number(),
    IsFavorite: z.boolean(),
    Played: z.boolean(),
    LastPlayedDate: z.string().datetime({ offset: true }).optional(),
    Key: z.string(),
    ItemId: z.string(),
}).passthrough();

const jellyfinItemBaseSchema = z.object({
    Name: z.string(),
    ServerId: z.string(),
    Id: z.string(),
    DateCreated: z.string().datetime({ offset: true }),
    PremiereDate: z.string().datetime({ offset: true }).nullable().optional(),
    EndDate: z.string().datetime({ offset: true }).nullable().optional(),
    ChannelId: z.string().nullable().optional(),
    Overview: z.string().nullable().optional(),
    Taglines: z.array(z.string()).default([]),
    Genres: z.array(z.string()).default([]),
    GenreItems: z.array(nameIdPairSchema).default([]),
    CommunityRating: z.number().nullable().optional(),
    OfficialRating: z.string().nullable().optional(),
    RunTimeTicks: z.number(),
    ProductionYear: z.number().nullable().optional(),
    Studios: z.array(studioSchema).default([]),
    UserData: userDataSchema,
    ChildCount: z.number(),
    LocationType: z.string().optional(),
    MediaType: z.string(),
    ImageTags: z.record(z.string(), z.string()).default({}),
    BackdropImageTags: z.array(z.string()).default([]),
    ImageBlurHashes: z
        .record(z.string(), z.record(z.string(), z.string()))
        .default({}),
    Status: z.string().optional(),
    AirTime: z.string().optional(),
    AirDays: z.array(z.string()).optional(),
    IndexNumber: z.number().optional(),
    ParentIndexNumber: z.number().optional(),
    SeriesName: z.string().optional(),
    SeriesId: z.string().optional(),
    SeasonId: z.string().optional(),
    SeriesPrimaryImageTag: z.string().optional(),
    SeasonName: z.string().optional(),
    PrimaryImageAspectRatio: z.number().optional(),
    VideoType: z.string().optional(),
    HasSubtitles: z.boolean().optional(),
    Container: z.string().optional(),
    ParentLogoItemId: z.string().optional(),
    ParentBackdropItemId: z.string().optional(),
    ParentBackdropImageTags: z.array(z.string()).optional(),
    ParentLogoImageTag: z.string().optional(),
}).passthrough();

export const jellyfinItemSchema = z.discriminatedUnion('Type', [
    jellyfinItemBaseSchema.extend({
        Type: z.literal('Series'),
        IsFolder: z.literal(true),
    }),
    jellyfinItemBaseSchema.extend({
        Type: z.literal('Episode'),
        IsFolder: z.literal(false),
    }),
    jellyfinItemBaseSchema.extend({
        Type: z.literal('Movie'),
        IsFolder: z.literal(false),
    }),
]);

export const jellyfinItemsResponseSchema = z.array(jellyfinItemSchema);

export type JellyfinItem = z.infer<typeof jellyfinItemSchema>;
export type JellyfinItemsResponse = z.infer<typeof jellyfinItemsResponseSchema>;