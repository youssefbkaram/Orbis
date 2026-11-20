import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const projectStatus = pgEnum("project_status", [
  "active",
  "completed",
  "archived",
]);

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    description: text("description"),
    domain: varchar("domain", { length: 80 }),
    lifeDomains: text("life_domains").array().default([]).notNull(),
    startDate: date("start_date"),
    targetDate: date("target_date"),
    progress: integer("progress").default(0).notNull(),
    status: projectStatus("status").default("active").notNull(),
    color: varchar("color", { length: 7 }).default("#2563eb").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("project_progress_range", sql`${table.progress} BETWEEN 0 AND 100`),
    index("project_user_status_idx").on(table.userId, table.status),
    index("project_user_target_date_idx").on(table.userId, table.targetDate),
  ],
);

export const projectRelations = relations(project, ({ one }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
}));
