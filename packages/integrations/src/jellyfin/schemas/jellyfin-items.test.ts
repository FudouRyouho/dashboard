import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(parsed.length, 40);
});

test('cada item tiene Type y IsFolder consistentes', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  for (const item of parsed) {
    if (item.Type === 'Series') {
      assert.equal(item.IsFolder, true);
    } else {
      assert.equal(item.IsFolder, false);
    }
  }
});

test('los 9 Episodes tienen SeriesName, SeasonId, IndexNumber, ParentIndexNumber', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const episodes = parsed.filter((item) => item.Type === 'Episode');
  assert.equal(episodes.length, 9);
  for (const ep of episodes) {
    assert.ok(ep.SeriesName, 'SeriesName presente');
    assert.ok(ep.SeasonId, 'SeasonId presente');
    assert.ok(ep.IndexNumber !== undefined, 'IndexNumber presente');
    assert.ok(ep.ParentIndexNumber !== undefined, 'ParentIndexNumber presente');
  }
});

test('la 1 Movie tiene VideoType', () => {
  const parsed = jellyfinItemsResponseSchema.parse(rawData);
  const movies = parsed.filter((item) => item.Type === 'Movie');
  assert.equal(movies.length, 1);
  assert.ok(movies[0]?.VideoType, 'VideoType presente');
});
