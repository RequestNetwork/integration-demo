import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestId: text('request_id').notNull(),
  status: text('status').notNull(),
});

export type Payment = typeof payments.$inferSelect;