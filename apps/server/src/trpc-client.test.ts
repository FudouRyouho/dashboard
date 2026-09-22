import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '.';
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://127.0.0.1:3050/trpc',
    }),
  ],
});

// Helper to check if server is running
async function isServerRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

describe('trpc-client integration tests', () => {
  test('health query returns ok (requires running server)', async () => {
    const running = await isServerRunning(3050);
    if (!running) {
      console.log('SKIP: Server not running at 127.0.0.1:3050, skipping network test');
      return;
    }
    const result = await trpc.health.query();
    assert.deepStrictEqual(result, { status: 'ok' });
  });

  test('calendar.getEvents returns array for valid range (requires running server)', async () => {
    const running = await isServerRunning(3050);
    if (!running) {
      console.log('SKIP: Server not running at 127.0.0.1:3050, skipping network test');
      return;
    }
    const result = await trpc.calendar.getEvents.query({
      start: new Date('2026-08-01T00:00:00.000Z'),
      end: new Date('2026-08-31T23:59:59.999Z'),
    });
    expect(Array.isArray(result).toBeTruthy());
  });
});