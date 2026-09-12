import test from 'node:test';
import assert from 'node:assert/strict';
import {
  imageCoverTypes,
  ImageSchema,
  aspectRatioByCoverType,
  chooseBestImage,
} from './image.js';

test('imageCoverTypes contains expected values', () => {
  assert.equal(imageCoverTypes.length, 7);
  assert.ok(imageCoverTypes.includes('poster'));
  assert.ok(imageCoverTypes.includes('banner'));
  assert.ok(imageCoverTypes.includes('fanart'));
  assert.ok(imageCoverTypes.includes('screenshot'));
  assert.ok(imageCoverTypes.includes('clearlogo'));
  assert.ok(imageCoverTypes.includes('headshot'));
  assert.ok(imageCoverTypes.includes('unknown'));
});

test('ImageSchema parses valid poster image', () => {
  const result = ImageSchema.parse({
    coverType: 'poster',
    remoteUrl: 'https://example.com/poster.jpg',
  });
  assert.equal(result.coverType, 'poster');
  assert.equal(result.remoteUrl, 'https://example.com/poster.jpg');
});

test('ImageSchema parses image with undefined remoteUrl', () => {
  const result = ImageSchema.parse({
    coverType: 'banner',
    remoteUrl: undefined,
  });
  assert.equal(result.coverType, 'banner');
  assert.equal(result.remoteUrl, undefined);
});

test('ImageSchema parses image without remoteUrl', () => {
  const result = ImageSchema.parse({
    coverType: 'fanart',
  });
  assert.equal(result.coverType, 'fanart');
  assert.equal(result.remoteUrl, undefined);
});

test('ImageSchema catches unknown coverType', () => {
  const result = ImageSchema.parse({
    coverType: 'invalid_type',
    remoteUrl: 'https://example.com/image.jpg',
  });
  assert.equal(result.coverType, 'unknown');
});

test('ImageSchema rejects invalid remoteUrl', () => {
  assert.throws(() => {
    ImageSchema.parse({
      coverType: 'poster',
      remoteUrl: 'not-a-url',
    });
  });
});

test('aspectRatioByCoverType has correct ratios', () => {
  assert.deepEqual(aspectRatioByCoverType.poster, { width: 2, height: 3 });
  assert.deepEqual(aspectRatioByCoverType.banner, { width: 758, height: 140 });
  assert.deepEqual(aspectRatioByCoverType.fanart, { width: 16, height: 9 });
  assert.deepEqual(aspectRatioByCoverType.headshot, { width: 1, height: 1 });
  assert.deepEqual(aspectRatioByCoverType.unknown, { width: 2, height: 3 });
});

test('chooseBestImage returns poster when available', () => {
  const images = [
    { coverType: 'poster', remoteUrl: 'https://example.com/poster.jpg' },
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
  ];
  const result = chooseBestImage(images as any);
  assert.ok(result);
  assert.equal(result!.coverType, 'poster');
});

test('chooseBestImage returns first available image by priority', () => {
  const images = [
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
    { coverType: 'poster', remoteUrl: 'https://example.com/poster.jpg' },
  ];
  const result = chooseBestImage(images as any);
  assert.ok(result);
  assert.equal(result!.coverType, 'poster');
});

test('chooseBestImage skips images without remoteUrl', () => {
  const images = [
    { coverType: 'poster', remoteUrl: undefined },
    { coverType: 'banner', remoteUrl: 'https://example.com/banner.jpg' },
  ];
  const result = chooseBestImage(images as any);
  assert.ok(result);
  assert.equal(result!.coverType, 'banner');
});

test('chooseBestImage returns undefined when no images with url', () => {
  const images = [
    { coverType: 'poster', remoteUrl: undefined },
    { coverType: 'banner', remoteUrl: undefined },
  ];
  const result = chooseBestImage(images as any);
  assert.equal(result, undefined);
});

test('chooseBestImage returns undefined for empty array', () => {
  const result = chooseBestImage([]);
  assert.equal(result, undefined);
});

test('chooseBestImage handles unknown coverType gracefully', () => {
  const images = [
    { coverType: 'unknown', remoteUrl: 'https://example.com/image.jpg' },
  ];
  const result = chooseBestImage(images as any);
  assert.ok(result);
  assert.equal(result!.coverType, 'unknown');
});
