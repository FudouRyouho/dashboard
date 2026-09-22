import { test, expect } from 'vitest';
import {
  imageCoverTypes,
  ImageSchema,
  aspectRatioByCoverType,
  chooseBestImage,
} from './image.js';

test('imageCoverTypes contains expected values', () => {
  expect(imageCoverTypes.length).toBe(7);
  expect(imageCoverTypes.includes('poster')).toBeTruthy();
  expect(imageCoverTypes.includes('banner')).toBeTruthy();
  expect(imageCoverTypes.includes('fanart')).toBeTruthy();
  expect(imageCoverTypes.includes('screenshot')).toBeTruthy();
  expect(imageCoverTypes.includes('clearlogo')).toBeTruthy();
  expect(imageCoverTypes.includes('headshot')).toBeTruthy();
  expect(imageCoverTypes.includes('unknown')).toBeTruthy();
});

test('ImageSchema parses valid poster image', () => {
  const result = ImageSchema.parse({
    coverType: 'poster',
    remoteUrl: 'https://example.com/poster.jpg',
  });
  expect(result.coverType).toBe('poster');
  expect(result.remoteUrl).toBe('https://example.com/poster.jpg');
});

test('ImageSchema parses image with undefined remoteUrl', () => {
  const result = ImageSchema.parse({
    coverType: 'banner',
    remoteUrl: undefined,
  });
  expect(result.coverType).toBe('banner');
  expect(result.remoteUrl).toBe(undefined);
});

test('ImageSchema parses image without remoteUrl', () => {
  const result = ImageSchema.parse({
    coverType: 'fanart',
  });
  expect(result.coverType).toBe('fanart');
  expect(result.remoteUrl).toBe(undefined);
});

test('ImageSchema catches unknown coverType', () => {
  const result = ImageSchema.parse({
    coverType: 'invalid_type',
    remoteUrl: 'https://example.com/image.jpg',
  });
  expect(result.coverType).toBe('unknown');
});

test('ImageSchema rejects invalid remoteUrl', () => {
  expect(() => {
    ImageSchema.parse({
      coverType: 'poster',
      remoteUrl: 'not-a-url',
    });
  });
});

test('aspectRatioByCoverType has correct ratios', () => {
  expect(aspectRatioByCoverType.poster).toEqual({ width: 2, height: 3 });
  expect(aspectRatioByCoverType.banner).toEqual({ width: 758, height: 140 });
  expect(aspectRatioByCoverType.fanart).toEqual({ width: 16, height: 9 });
  expect(aspectRatioByCoverType.headshot).toEqual({ width: 1, height: 1 });
  expect(aspectRatioByCoverType.unknown).toEqual({ width: 2, height: 3 });
});

test('chooseBestImage returns poster when available', () => {
  const images = [
    { coverType: 'poster', remoteUrl: 'https://example.com/poster.jpg' },
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
  ];
  const result = chooseBestImage(images as any);
  expect(result).toBeTruthy();
  expect(result!.coverType).toBe('poster');
});

test('chooseBestImage returns first available image by priority', () => {
  const images = [
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
    { coverType: 'poster', remoteUrl: 'https://example.com/poster.jpg' },
  ];
  const result = chooseBestImage(images as any);
  expect(result).toBeTruthy();
  expect(result!.coverType).toBe('poster');
});

test('chooseBestImage skips images without remoteUrl', () => {
  const images = [
    { coverType: 'poster', remoteUrl: undefined },
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
  ];
  const result = chooseBestImage(images as any);
  expect(result).toBeTruthy();
  expect(result!.coverType).toBe('banner');
});

test('chooseBestImage returns undefined when no images with url', () => {
  const images = [
    { coverType: 'poster', remoteUrl: undefined },
    { coverType: 'banner', remoteUrl: undefined },
  ];
  const result = chooseBestImage(images as any);
  expect(result).toBe(undefined);
});

test('chooseBestImage returns undefined for empty array', () => {
  const result = chooseBestImage([]);
  expect(result).toBe(undefined);
});

test('chooseBestImage handles unknown coverType gracefully', () => {
  const images = [
    { coverType: 'unknown', remoteUrl: 'https://example.com/image.jpg' },
  ];
  const result = chooseBestImage(images as any);
  expect(result).toBeTruthy();
  expect(result!.coverType).toBe('unknown');
});
