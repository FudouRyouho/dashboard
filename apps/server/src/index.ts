import { createTRPCRouter, publicProcedure } from "./trpc";
import { calendarRouter } from "./routers/calendar";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: "ok" })),
  
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;