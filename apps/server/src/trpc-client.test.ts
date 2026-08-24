import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '.';
import superjson from 'superjson';

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://127.0.0.1:3050/trpc',
      transformer: superjson,
    }),
  ],
});

const main = async () => {
  const healt = await trpc.health.query();

  console.dir(healt, { depth: null });
};

const calendar = await trpc.calendar.getEvents.query({
  start: new Date('2026-08-01T00:00:00.000Z'),
  end: new Date('2026-08-31T23:59:59.999Z'),
});

console.dir(calendar, { depth: null });

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
