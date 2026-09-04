import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const serverLogEntries = sqliteTable('server_log_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  level: text('level').notNull(),
  source: text('source'),
  message: text('message').notNull(),
  detail: text('detail'),
});
