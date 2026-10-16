import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const links = pgTable(
  'links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    originalUrl: text('original_url').notNull(),
    shortUrl: varchar('short_url', { length: 128 }).notNull().unique(),
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('links_created_at_idx').on(table.createdAt)],
);

export type Link = typeof links.$inferSelect;
