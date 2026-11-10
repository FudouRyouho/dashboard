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
    if (item.Type === 'Series' || item.Type === 'Season') {
      expect(item.IsFolder).toBe(true);
    } else {
      expect(item.IsFolder).toBe(false);
    }
  }
});

test('los 20 Episodes tienen SeriesName, SeasonId, IndexNumber, ParentIndexNumber', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const episodes = parsed.filter((item) => item.Type === 'Episode');
  expect(episodes.length).toBe(20);
  for (const ep of episodes) {
    expect(ep.SeriesName, 'SeriesName present').toBeTruthy();
    expect(ep.SeasonId, 'SeasonId present').toBeTruthy();
    expect(ep.IndexNumber !== undefined, 'IndexNumber present').toBeTruthy();
    expect(
      ep.ParentIndexNumber !== undefined,
      'ParentIndexNumber present',
    ).toBeTruthy();
  }
});

test('Episode no requiere ChildCount (nullable en Jellyfin 12.4.0)', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const episode = parsed.find((item) => item.Type === 'Episode');
  expect(episode).toBeTruthy();
  // El payload real de /Items/Latest no incluye ChildCount en Episodes
  expect(episode?.ChildCount).toBeUndefined();
});

test('el payload real incluye Seasons, tratados como tipo Season', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const seasons = parsed.filter((item) => item.Type === 'Season');
  expect(seasons.length).toBe(7);
  for (const season of seasons) {
    expect(season.ChildCount).toBeTypeOf('number');
  }
});

test('el payload real de 12.4.0 no incluye Movies', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const movies = parsed.filter((item) => item.Type === 'Movie');
  expect(movies.length).toBe(0);
});
