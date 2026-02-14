import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const Testusers = pgTable('testusers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
