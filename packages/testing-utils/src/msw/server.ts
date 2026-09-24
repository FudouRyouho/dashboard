import { setupServer, type SetupServer } from 'msw/node';

/**
 * Create an MSW server with the given handlers.
 * The server is NOT started automatically — call `server.listen()` in beforeEach
 * and `server.close()` in afterEach.
 *
 * @example
 * import { setupServer } from '@dashboard/testing-utils/msw';
 * import { sonarrHandlers } from '@dashboard/testing-utils/msw';
 *
 * const server = setupServer(...sonarrHandlers({ kind: 'sonarr', id: 's1', url: 'http://test', port: 8989, apiKey: 'key' }));
 *
 * beforeEach(() => server.listen());
 * afterEach(() => server.close());
 */
export { setupServer };
export type { SetupServer as Server };