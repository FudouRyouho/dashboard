import z from 'zod';

export const imageCoverTypes = [
  'poster',
  'banner',
  'fanart',
  'screenshot',
  'clearlogo',
  'headshot',
  'unknown',
] as const;

export type ImageCoverType = (typeof imageCoverTypes)[number];

export const ImageSchema = z.object({
  coverType: z.enum(imageCoverTypes).catch('unknown'),
  remoteUrl: z.string().url().optional(),
});

export type ImageSchema = z.infer<typeof ImageSchema>;

export const aspectRatioByCoverType: Record<
  ImageCoverType,
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

export const chooseBestImage = (
  images: ImageSchema[],
): ImageSchema | undefined =>
  [...images]
    .filter((image) => image.remoteUrl)
    .sort(
      (a, b) =>
        imageCoverTypes.indexOf(a.coverType) -
        imageCoverTypes.indexOf(b.coverType),
    )[0];
