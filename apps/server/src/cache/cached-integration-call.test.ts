import test from 'node:test';
import assert from 'node:assert/strict';
import type { CacheEntry, CacheStore } from '@dashboard/common';
import { z } from 'zod';
import {
  ICalendarIntegration,
  Integration,
  IntegrationError,
} from '@dashboard/integrations';
import { getCalendarCached } from './cached-integration-call';
import { type CalendarEvent } from '@dashboard/contracts';
const evento = (id: string): CalendarEvent => ({
  id,
  title: `Episodio ${id}`,
  subtitle: null,
  description: null,
  startDate: '2026-08-10T00:00:00.000Z',
  endDate: null,
  image: null,
  location: null,
  metadata: { type: 'episode', seriesId: 1, seasonNumber: 1, episodeNumber: 1 },
  indicatorColor: 'blue',
  links: [],
});

const createFakeStore = (seed?: CacheEntry<CalendarEvent[]>) => {
  let entry = seed;
  const store: CacheStore = {
    get: <T>() => entry as CacheEntry<T> | undefined,
    set: <T>(_key: string, data: T) => {
      entry = { data: data as CalendarEvent[], updatedAt: new Date() };
    },
  };
  return { store, current: () => entry };
};

class FakeCalendarIntegration
  extends Integration
  implements ICalendarIntegration
{
  public llamadas = 0;
  public debeFallar = false;
  /** Error concreto a lanzar; por defecto uno genérico. */
  public error: unknown = new Error('Sonarr caído');

  constructor() {
    super({
      kind: 'sonarr',
      id: 'fake-1',
      name: 'Fake Sonarr',
      url: 'http://localhost',
      secrets: [],
    });
  }

  async getCalendarEventsAsync(): Promise<CalendarEvent[]> {
    this.llamadas += 1;
    if (this.debeFallar) {
      throw this.error;
    }
    return [evento('fresco')];
  }
}

const createFakeLogger = () => {
  const warnings: string[] = [];
  return {
    logger: {
      warn: (_obj: Record<string, unknown>, msg: string) =>
        void warnings.push(msg),
    },
    warnings,
  };
};

const start = new Date('2026-08-01T00:00:00.000Z');
const end = new Date('2026-08-31T00:00:00.000Z');

const hace = (ms: number) => new Date(Date.now() - ms);

test('1. sin caché + integración responde → ok, guarda el dato', async () => {
  const { store, current } = createFakeStore();
  const integration = new FakeCalendarIntegration();
  const { logger } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'ok');
  assert.equal(result.events.length, 1);
  assert.equal(integration.llamadas, 1, 'debe llamar a la integración');
  assert.ok(current(), 'debe haber guardado en el store');
});

test('2. caché fresco (30s) → ok sin tocar la integración', async () => {
  const { store } = createFakeStore({
    data: [evento('cacheado')],
    updatedAt: hace(30_000),
  });
  const integration = new FakeCalendarIntegration();
  const { logger } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'ok');
  assert.equal(result.events[0]?.id, 'cacheado');
  assert.equal(integration.llamadas, 0, 'NO debe llamar a la integración');
});

test('3. caché vencido (5min) + integración responde → ok, refresca', async () => {
  const { store } = createFakeStore({
    data: [evento('viejo')],
    updatedAt: hace(300_000),
  });
  const integration = new FakeCalendarIntegration();
  const { logger } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'ok');
  assert.equal(result.events[0]?.id, 'fresco', 'debe traer el dato nuevo');
  assert.equal(integration.llamadas, 1);
});

test('4. caché vencido + integración caída → stale con el dato viejo', async () => {
  const updatedAt = hace(300_000);
  const { store } = createFakeStore({ data: [evento('viejo')], updatedAt });
  const integration = new FakeCalendarIntegration();
  integration.debeFallar = true;
  const { logger, warnings } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'stale');
  assert.equal(result.events[0]?.id, 'viejo', 'devuelve el último dato bueno');
  assert.deepEqual(
    result.status.updatedAt,
    updatedAt,
    'updatedAt es el del dato viejo',
  );
  assert.equal(warnings.length, 1, 'debe loguear el fallo');
});

test('5. sin caché + integración caída → failed con lista vacía', async () => {
  const { store } = createFakeStore();
  const integration = new FakeCalendarIntegration();
  integration.debeFallar = true;
  const { logger, warnings } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'failed');
  assert.equal(result.status.updatedAt, null);
  assert.deepEqual(result.events, []);
  assert.equal(warnings.length, 1);
});

test('6. secuencia: ok → hit → caída → recuperación', async () => {
  const { store } = createFakeStore();
  const integration = new FakeCalendarIntegration();
  const { logger } = createFakeLogger();

  const call = () =>
    getCalendarCached(store, integration, start, end, false, logger);

  const primera = await call();
  assert.equal(primera.status.code, 'ok');
  assert.equal(integration.llamadas, 1);

  const segunda = await call();
  assert.equal(segunda.status.code, 'ok');
  assert.equal(integration.llamadas, 1, 'salió del caché, no volvió a llamar');
  assert.deepEqual(segunda.status.updatedAt, primera.status.updatedAt);
});

const errorDeRed = (code: string) => {
  const err = new TypeError('fetch failed');
  (err as { cause?: unknown }).cause = { code };
  return err;
};

const casos: {
  nombre: string;
  error: unknown;
  reason: string;
  httpStatus?: number;
}[] = [
  {
    nombre: 'API key rechazada (401)',
    error: IntegrationError.fromHttpResponse(401, 'Unauthorized'),
    reason: 'unauthorized',
    httpStatus: 401,
  },
  {
    nombre: 'prohibido (403)',
    error: IntegrationError.fromHttpResponse(403, 'Forbidden'),
    reason: 'unauthorized',
    httpStatus: 403,
  },
  {
    nombre: 'error del servicio (500)',
    error: IntegrationError.fromHttpResponse(500, 'Internal Server Error'),
    reason: 'unknown',
    httpStatus: 500,
  },
  {
    nombre: 'servicio apagado (ECONNREFUSED)',
    error: errorDeRed('ECONNREFUSED'),
    reason: 'unreachable',
  },
  {
    nombre: 'DNS no resuelve (ENOTFOUND)',
    error: errorDeRed('ENOTFOUND'),
    reason: 'unreachable',
  },
  {
    nombre: 'timeout del AbortSignal',
    error: Object.assign(
      new Error('The operation was aborted due to timeout'),
      {
        name: 'TimeoutError',
      },
    ),
    reason: 'timeout',
  },
  {
    nombre: 'respuesta con forma inesperada (ZodError)',
    error: new z.ZodError([]),
    reason: 'invalid-response',
  },
];

for (const caso of casos) {
  test(`7. reason: ${caso.nombre} → '${caso.reason}'`, async () => {
    const { store } = createFakeStore();
    const integration = new FakeCalendarIntegration();
    integration.debeFallar = true;
    integration.error = caso.error;
    const { logger } = createFakeLogger();

    const result = await getCalendarCached(
      store,
      integration,
      start,
      end,
      false,
      logger,
    );

    assert.equal(result.status.code, 'failed');
    assert.equal(result.status.reason, caso.reason);
    assert.equal(result.status.httpStatus, caso.httpStatus);
  });
}

test('8. un stale también informa por qué falló el refresco', async () => {
  const { store } = createFakeStore({
    data: [evento('viejo')],
    updatedAt: hace(300_000),
  });
  const integration = new FakeCalendarIntegration();
  integration.debeFallar = true;
  integration.error = IntegrationError.fromHttpResponse(401, 'Unauthorized');
  const { logger } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'stale');
  assert.equal(
    result.status.reason,
    'unauthorized',
    'no es lo mismo caído que sin permiso',
  );
  assert.equal(result.status.httpStatus, 401);
  assert.equal(result.events[0]?.id, 'viejo');
});

test('9. un ok no lleva reason ni httpStatus', async () => {
  const { store } = createFakeStore();
  const integration = new FakeCalendarIntegration();
  const { logger } = createFakeLogger();

  const result = await getCalendarCached(
    store,
    integration,
    start,
    end,
    false,
    logger,
  );

  assert.equal(result.status.code, 'ok');
  assert.equal(result.status.reason, undefined);
  assert.equal(result.status.httpStatus, undefined);
});
