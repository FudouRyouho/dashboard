import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schemas/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/dashboard.sqlite',
  },
});
