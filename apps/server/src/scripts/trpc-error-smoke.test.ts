import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '..';
import 'dotenv/config';

const port = Number(process.env.DASHBOARD_SERVER_PORT || 3050);

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `http://127.0.0.1:${port}/trpc`,
      transformer: superjson,
    }),
  ],
});

try {
  await trpc.calendar.getEvents.query({
    start: new Date('2026-08-01T00:00:00.000Z'),
    end: new Date('2026-08-31T00:00:00.000Z'),
  });
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.dir(
      {
        message: error.message,
        data: error.data,
      },
      { depth: null },
    );
  } else {
    console.error(error);
  }
}
