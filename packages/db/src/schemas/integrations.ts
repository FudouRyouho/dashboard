import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const integrationInstances = sqliteTable('integration_instances', {
  id: text('id').primaryKey(),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  externalUrl: text('external_url'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
