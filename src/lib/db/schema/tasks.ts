import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const task = pgTable(
  "task",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    notes: text("notes"),
    project: text("project"),
    labels: text("labels").array().default([]).notNull(),
    dueDate: date("due_date"),
    scheduledDate: date("scheduled_date"),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    location: text("location"),
    priority: integer("priority").default(4).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_user_id_idx").on(table.userId),
    index("task_user_scheduled_date_idx").on(table.userId, table.scheduledDate),
  ],
);

export const taskSubtask = pgTable(
  "task_subtask",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    notes: text("notes"),
    project: text("project"),
    labels: text("labels").array().default([]).notNull(),
    scheduledDate: date("scheduled_date"),
    dueDate: date("due_date"),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    location: text("location"),
    priority: integer("priority").default(4).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("task_subtask_task_id_idx").on(table.taskId)],
);

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  subtasks: many(taskSubtask),
}));

export const taskSubtaskRelations = relations(taskSubtask, ({ one }) => ({
  task: one(task, {
    fields: [taskSubtask.taskId],
    references: [task.id],
  }),
}));
