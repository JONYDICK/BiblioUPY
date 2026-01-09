import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'book', 'document', 'pdf'
  description: text("description").notNull(),
  link: text("link").notNull(),
  topic: text("topic").notNull().default('General'),
  theme: text("theme").notNull().default('General'),
  purpose: text("purpose").notNull().default('Academic'),
  career: text("career").notNull().default('All'),
});

export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
