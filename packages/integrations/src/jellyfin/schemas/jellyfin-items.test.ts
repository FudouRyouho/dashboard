import { test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { jellyfinItemsResponseSchema } from './jellyfin-items';

// Resolver ruta al captured.json desde la ubicación del test
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const capturedPath = join(
  __dirname,
  '../../../../../references/responses/jellyfin-items-latest.captured.json',
);

const rawData = JSON.parse(readFileSync(capturedPath, 'utf8'));

test('jellyfinItemsResponseSchema parsea los 40 items capturados', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  expect(parsed.length).toBe(40);
});

test('cada item tiene Type y IsFolder consistentes', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  for (const item of parsed) {
    if (item.Type === 'Series') {
      expect(item.IsFolder).toBe(true);
    } else {
      expect(item.IsFolder).toBe(false);
    }
  }
});

test('los 9 Episodes tienen SeriesName, SeasonId, IndexNumber, ParentIndexNumber', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const episodes = parsed.filter((item) => item.Type === 'Episode');
  expect(episodes.length).toBe(9);
  for (const ep of episodes) {
    expect(ep.SeriesName, 'SeriesName presente').toBeTruthy();
    expect(ep.SeasonId, 'SeasonId presente').toBeTruthy();
    expect(ep.IndexNumber !== undefined, 'IndexNumber presente').toBeTruthy();
    expect(ep.ParentIndexNumber !== undefined, 'ParentIndexNumber presente').toBeTruthy();
  }
});

test('la 1 Movie tiene VideoType', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const movies = parsed.filter((item) => item.Type === 'Movie');
  expect(movies.length).toBe(1);
  expect(movies[0]?.VideoType, 'VideoType presente').toBeTruthy();
});
