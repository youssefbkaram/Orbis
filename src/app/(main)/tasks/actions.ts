"use server";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { task, taskSubtask } from "@/lib/db/schema";
import type { TaskRecord, TaskSubtaskRecord } from "@/components/pages/tasks/types";

const taskInputSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  notes: z.string().trim().max(10000).nullable().optional(),
  project: z.string().trim().max(80).nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  dueDate: z.iso.date().nullable(),
  scheduledDate: z.iso.date().nullable(),
  reminderAt: z.iso.datetime().nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  priority: z.number().int().min(1).max(4),
});
const taskUpdateSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable(),
  notes: z.string().trim().max(10000).nullable(),
  project: z.string().trim().max(80).nullable(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20),
  dueDate: z.iso.date().nullable(),
  scheduledDate: z.iso.date().nullable(),
  reminderAt: z.iso.datetime().nullable(),
  location: z.string().trim().max(200).nullable(),
  priority: z.number().int().min(1).max(4),
  completed: z.boolean(),
});
const subtaskInputSchema = z.object({
  taskId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  notes: z.string().trim().max(10000).nullable().optional(),
  project: z.string().trim().max(80).nullable(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  scheduledDate: z.iso.date().nullable(),
  dueDate: z.iso.date().nullable(),
  reminderAt: z.iso.datetime().nullable(),
  location: z.string().trim().max(200).nullable().optional(),
  priority: z.number().int().min(1).max(4),
});

async function getUserId() {
  const session = await getServerSession();

  if (!session) {
    throw new Error("You must be signed in to manage tasks.");
  }

  return session.user.id;
}

function getDatabase() {
  if (!db) {
    throw new Error("The database is not configured.");
  }

  return db;
}

export async function createTask(input: unknown): Promise<TaskRecord> {
  const values = taskInputSchema.parse(input);
  const userId = await getUserId();
  const [created] = await getDatabase()
    .insert(task)
    .values({
      id: values.id,
      userId,
      title: values.title,
      description: values.description?.trim() || null,
      notes: values.notes?.trim() || null,
      project: values.project || null,
      labels: values.labels ?? [],
      dueDate: values.dueDate,
      scheduledDate: values.scheduledDate,
      reminderAt: values.reminderAt ? new Date(values.reminderAt) : null,
      location: values.location || null,
      priority: values.priority,
    })
    .returning({
      id: task.id,
      title: task.title,
      description: task.description,
      notes: task.notes,
      project: task.project,
      labels: task.labels,
      dueDate: task.dueDate,
      scheduledDate: task.scheduledDate,
      reminderAt: task.reminderAt,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
    });

  revalidatePath("/tasks");
  return { ...created, reminderAt: created.reminderAt?.toISOString() ?? null };
}

export async function updateTask(input: unknown): Promise<TaskRecord> {
  const values = taskUpdateSchema.parse(input);
  const userId = await getUserId();
  const [updated] = await getDatabase()
    .update(task)
    .set({
      title: values.title,
      description: values.description || null,
      notes: values.notes || null,
      project: values.project || null,
      labels: values.labels,
      dueDate: values.dueDate,
      scheduledDate: values.scheduledDate,
      reminderAt: values.reminderAt ? new Date(values.reminderAt) : null,
      location: values.location || null,
      priority: values.priority,
      completed: values.completed,
    })
    .where(and(eq(task.id, values.id), eq(task.userId, userId)))
    .returning({
      id: task.id,
      title: task.title,
      description: task.description,
      notes: task.notes,
      project: task.project,
      labels: task.labels,
      dueDate: task.dueDate,
      scheduledDate: task.scheduledDate,
      reminderAt: task.reminderAt,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
    });

  if (!updated) {
    throw new Error("Task was not found for the signed-in account.");
  }

  revalidatePath("/tasks");
  return { ...updated, reminderAt: updated.reminderAt?.toISOString() ?? null };
}

export async function duplicateTask(taskId: string): Promise<TaskRecord> {
  const id = z.uuid().parse(taskId);
  const userId = await getUserId();
  const database = getDatabase();
  const [original] = await database
    .select()
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .limit(1);

  if (!original) {
    throw new Error("Task was not found for the signed-in account.");
  }

  const originalSubtasks = await database
    .select({
      title: taskSubtask.title,
      description: taskSubtask.description,
      notes: taskSubtask.notes,
      project: taskSubtask.project,
      labels: taskSubtask.labels,
      scheduledDate: taskSubtask.scheduledDate,
      dueDate: taskSubtask.dueDate,
      reminderAt: taskSubtask.reminderAt,
      location: taskSubtask.location,
      priority: taskSubtask.priority,
      sortOrder: taskSubtask.sortOrder,
    })
    .from(taskSubtask)
    .where(eq(taskSubtask.taskId, id));
  const duplicateId = crypto.randomUUID();
  const createTaskQuery = database
    .insert(task)
    .values({
      id: duplicateId,
      userId,
      title: `${original.title} (copy)`,
      description: original.description,
      notes: original.notes,
      project: original.project,
      labels: original.labels,
      dueDate: original.dueDate,
      scheduledDate: original.scheduledDate,
      reminderAt: original.reminderAt,
      location: original.location,
      priority: original.priority,
    })
    .returning({
      id: task.id,
      title: task.title,
      description: task.description,
      notes: task.notes,
      project: task.project,
      labels: task.labels,
      dueDate: task.dueDate,
      scheduledDate: task.scheduledDate,
      reminderAt: task.reminderAt,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
    });

  const copySubtasksQuery =
    originalSubtasks.length > 0
      ? database.insert(taskSubtask).values(
          originalSubtasks.map((subtask) => ({
            id: crypto.randomUUID(),
            taskId: duplicateId,
            ...subtask,
          })),
        )
      : null;
  // Neon HTTP exposes transactional batches rather than Drizzle's transaction callback.
  const [created] = copySubtasksQuery
    ? (await database.batch([createTaskQuery, copySubtasksQuery]))[0]
    : (await database.batch([createTaskQuery]))[0];

  revalidatePath("/tasks");
  return { ...created, reminderAt: created.reminderAt?.toISOString() ?? null };
}

export async function deleteTask(taskId: string): Promise<void> {
  const id = z.uuid().parse(taskId);
  const userId = await getUserId();
  const [deleted] = await getDatabase()
    .delete(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .returning({ id: task.id });

  if (!deleted) {
    throw new Error("Task was not found for the signed-in account.");
  }

  revalidatePath("/tasks");
}

export async function getTaskActivity(taskId: string) {
  const id = z.uuid().parse(taskId);
  const userId = await getUserId();
  const [activity] = await getDatabase()
    .select({
      title: task.title,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    })
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .limit(1);

  if (!activity) {
    throw new Error("Task was not found for the signed-in account.");
  }

  return {
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  };
}

export async function getTaskSubtasks(
  taskId: string,
): Promise<TaskSubtaskRecord[]> {
  const id = z.uuid().parse(taskId);
  const userId = await getUserId();
  await ensureOwnedTask(id, userId);

  const subtasks = await getDatabase()
    .select({
      id: taskSubtask.id,
      taskId: taskSubtask.taskId,
      title: taskSubtask.title,
      description: taskSubtask.description,
      notes: taskSubtask.notes,
      project: taskSubtask.project,
      labels: taskSubtask.labels,
      scheduledDate: taskSubtask.scheduledDate,
      dueDate: taskSubtask.dueDate,
      reminderAt: taskSubtask.reminderAt,
      location: taskSubtask.location,
      priority: taskSubtask.priority,
      completed: taskSubtask.completed,
      sortOrder: taskSubtask.sortOrder,
    })
    .from(taskSubtask)
    .where(eq(taskSubtask.taskId, id))
    .orderBy(asc(taskSubtask.sortOrder), asc(taskSubtask.createdAt), asc(taskSubtask.id));
  return subtasks.map((subtask) => ({
    ...subtask,
    reminderAt: subtask.reminderAt?.toISOString() ?? null,
  }));
}

export async function reorderTasks(
  input: {
    taskIds: string[];
    movedTaskId: string;
    scheduledDate: string | null;
  },
): Promise<void> {
  const values = z.object({
    taskIds: z.array(z.uuid()).min(1).max(500),
    movedTaskId: z.uuid(),
    scheduledDate: z.iso.date().nullable(),
  }).parse(input);
  if (new Set(values.taskIds).size !== values.taskIds.length) {
    throw new Error("Task order contains duplicate items.");
  }
  if (!values.taskIds.includes(values.movedTaskId)) {
    throw new Error("Moved task must be part of the new order.");
  }
  const userId = await getUserId();
  const database = getDatabase();
  const owned = await database
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.userId, userId), inArray(task.id, values.taskIds)));
  if (owned.length !== values.taskIds.length) {
    throw new Error("One or more tasks are unavailable for this account.");
  }

  const sortOrderCase = sql`case ${task.id} ${sql.join(
    values.taskIds.map((id, index) => sql`when ${id} then ${index}`),
    sql` `,
  )} else ${task.sortOrder} end`;
  const scheduledDateCase = sql`case when ${task.id} = ${values.movedTaskId} then ${values.scheduledDate}::date else ${task.scheduledDate} end`;
  await database
    .update(task)
    .set({ sortOrder: sortOrderCase, scheduledDate: scheduledDateCase })
    .where(and(eq(task.userId, userId), inArray(task.id, values.taskIds)));
  revalidatePath("/tasks");
}

export async function reorderSubtasks(
  taskId: string,
  subtaskIds: string[],
): Promise<void> {
  const parentId = z.uuid().parse(taskId);
  const ids = z.array(z.uuid()).min(1).max(500).parse(subtaskIds);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Sub-task order contains duplicate items.");
  }
  const userId = await getUserId();
  await ensureOwnedTask(parentId, userId);
  const database = getDatabase();
  const existing = await database
    .select({ id: taskSubtask.id })
    .from(taskSubtask)
    .where(and(eq(taskSubtask.taskId, parentId), inArray(taskSubtask.id, ids)));
  if (existing.length !== ids.length) {
    throw new Error("One or more sub-tasks are unavailable.");
  }
  const sortOrderCase = sql`case ${taskSubtask.id} ${sql.join(
    ids.map((id, index) => sql`when ${id} then ${index}`),
    sql` `,
  )} else ${taskSubtask.sortOrder} end`;
  await database
    .update(taskSubtask)
    .set({ sortOrder: sortOrderCase })
    .where(and(eq(taskSubtask.taskId, parentId), inArray(taskSubtask.id, ids)));
  revalidatePath("/tasks");
}

export async function moveSubtaskToTask(
  subtaskId: string,
  sourceTaskId: string,
  targetTaskId: string,
): Promise<TaskSubtaskRecord> {
  const childId = z.uuid().parse(subtaskId);
  const sourceId = z.uuid().parse(sourceTaskId);
  const targetId = z.uuid().parse(targetTaskId);
  const userId = await getUserId();
  await ensureOwnedTask(sourceId, userId);
  await ensureOwnedTask(targetId, userId);
  const database = getDatabase();
  const targetSubtasks = await database
    .select({ sortOrder: taskSubtask.sortOrder })
    .from(taskSubtask)
    .where(eq(taskSubtask.taskId, targetId));
  const nextSortOrder = targetSubtasks.reduce(
    (maximum, item) => Math.max(maximum, item.sortOrder),
    -1,
  ) + 1;
  const [updated] = await database
    .update(taskSubtask)
    .set({ taskId: targetId, sortOrder: nextSortOrder })
    .where(and(eq(taskSubtask.id, childId), eq(taskSubtask.taskId, sourceId)))
    .returning({
      id: taskSubtask.id,
      taskId: taskSubtask.taskId,
      title: taskSubtask.title,
      description: taskSubtask.description,
      notes: taskSubtask.notes,
      project: taskSubtask.project,
      labels: taskSubtask.labels,
      scheduledDate: taskSubtask.scheduledDate,
      dueDate: taskSubtask.dueDate,
      reminderAt: taskSubtask.reminderAt,
      location: taskSubtask.location,
      priority: taskSubtask.priority,
      completed: taskSubtask.completed,
    });
  if (!updated) throw new Error("Sub-task was not found.");
  revalidatePath("/tasks");
  return { ...updated, reminderAt: updated.reminderAt?.toISOString() ?? null };
}

export async function promoteSubtaskToTask(
  subtaskId: string,
  parentTaskId: string,
  scheduledDate: string | null,
  newTaskId: string,
): Promise<TaskRecord> {
  const childId = z.uuid().parse(subtaskId);
  const parentId = z.uuid().parse(parentTaskId);
  const date = z.iso.date().nullable().parse(scheduledDate);
  const promotedId = z.uuid().parse(newTaskId);
  const userId = await getUserId();
  await ensureOwnedTask(parentId, userId);
  const database = getDatabase();
  const [subtask] = await database
    .select()
    .from(taskSubtask)
    .where(and(eq(taskSubtask.id, childId), eq(taskSubtask.taskId, parentId)))
    .limit(1);
  if (!subtask) throw new Error("Sub-task was not found.");

  const createTaskQuery = database
    .insert(task)
    .values({
      id: promotedId,
      userId,
      title: subtask.title,
      description: subtask.description,
      notes: subtask.notes,
      project: subtask.project,
      labels: subtask.labels,
      dueDate: subtask.dueDate,
      scheduledDate: date,
      reminderAt: subtask.reminderAt,
      location: subtask.location,
      priority: subtask.priority,
      completed: subtask.completed,
    })
    .returning({
      id: task.id,
      title: task.title,
      description: task.description,
      notes: task.notes,
      project: task.project,
      labels: task.labels,
      dueDate: task.dueDate,
      scheduledDate: task.scheduledDate,
      reminderAt: task.reminderAt,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
    });

  const deleteSubtaskQuery = database
    .delete(taskSubtask)
    .where(and(eq(taskSubtask.id, childId), eq(taskSubtask.taskId, parentId)))
    .returning({ id: taskSubtask.id });
  const rollbackCreatedTaskQuery = database
    .delete(task)
    .where(
      and(
        eq(task.id, promotedId),
        eq(task.userId, userId),
        sql`exists (select 1 from ${taskSubtask} where ${taskSubtask.id} = ${childId} and ${taskSubtask.taskId} = ${parentId})`,
      ),
    );
  // Keep the conversion and its compensating delete in the same Neon transaction.
  const [createdRows, deletedSubtasks] = await database.batch([
    createTaskQuery,
    deleteSubtaskQuery,
    rollbackCreatedTaskQuery,
  ]);
  const [created] = createdRows;
  if (!deletedSubtasks.length) {
    throw new Error("Sub-task could not be moved.");
  }
  revalidatePath("/tasks");
  return { ...created, reminderAt: created.reminderAt?.toISOString() ?? null };
}

export async function demoteTaskToSubtask(
  sourceTaskId: string,
  targetTaskId: string,
): Promise<TaskSubtaskRecord> {
  const sourceId = z.uuid().parse(sourceTaskId);
  const targetId = z.uuid().parse(targetTaskId);
  if (sourceId === targetId) throw new Error("A task cannot become its own sub-task.");
  const userId = await getUserId();
  await ensureOwnedTask(sourceId, userId);
  await ensureOwnedTask(targetId, userId);
  const database = getDatabase();
  const [source] = await database
    .select({
      id: task.id,
      title: task.title,
      description: task.description,
      notes: task.notes,
      project: task.project,
      labels: task.labels,
      scheduledDate: task.scheduledDate,
      dueDate: task.dueDate,
      reminderAt: task.reminderAt,
      location: task.location,
      priority: task.priority,
      completed: task.completed,
    })
    .from(task)
    .where(and(eq(task.id, sourceId), eq(task.userId, userId)))
    .limit(1);
  if (!source) throw new Error("Task was not found.");

  const children = await database
    .select({ id: taskSubtask.id, sortOrder: taskSubtask.sortOrder })
    .from(taskSubtask)
    .where(eq(taskSubtask.taskId, sourceId))
    .orderBy(asc(taskSubtask.sortOrder), asc(taskSubtask.id));
  const targetSubtasks = await database
    .select({ sortOrder: taskSubtask.sortOrder })
    .from(taskSubtask)
    .where(eq(taskSubtask.taskId, targetId));
  const nextSortOrder = targetSubtasks.reduce(
    (maximum, item) => Math.max(maximum, item.sortOrder),
    -1,
  ) + 1;
  const demotedSubtaskId = crypto.randomUUID();
  const insertSubtaskQuery = database
    .insert(taskSubtask)
    .values({
      ...source,
      id: demotedSubtaskId,
      taskId: targetId,
      sortOrder: nextSortOrder,
    })
    .returning({
      id: taskSubtask.id,
      taskId: taskSubtask.taskId,
      title: taskSubtask.title,
      description: taskSubtask.description,
      notes: taskSubtask.notes,
      project: taskSubtask.project,
      labels: taskSubtask.labels,
      scheduledDate: taskSubtask.scheduledDate,
      dueDate: taskSubtask.dueDate,
      reminderAt: taskSubtask.reminderAt,
      location: taskSubtask.location,
      priority: taskSubtask.priority,
      completed: taskSubtask.completed,
      sortOrder: taskSubtask.sortOrder,
    });

  const moveChildrenQuery =
    children.length > 0
      ? database
          .update(taskSubtask)
          .set({
            taskId: targetId,
            sortOrder: sql`case ${taskSubtask.id} ${sql.join(
              children.map(
                (child, index) =>
                  sql`when ${child.id} then ${nextSortOrder + index + 1}`,
              ),
              sql` `,
            )} else ${taskSubtask.sortOrder} end`,
          })
          .where(eq(taskSubtask.taskId, sourceId))
          .returning({ id: taskSubtask.id })
      : null;
  const deleteSourceQuery = database
    .delete(task)
    .where(and(eq(task.id, sourceId), eq(task.userId, userId)))
    .returning({ id: task.id });
  const restoreChildrenQuery =
    children.length > 0
      ? database
          .update(taskSubtask)
          .set({
            taskId: sourceId,
            sortOrder: sql`case ${taskSubtask.id} ${sql.join(
              children.map((child) => sql`when ${child.id} then ${child.sortOrder}`),
              sql` `,
            )} else ${taskSubtask.sortOrder} end`,
          })
          .where(
            and(
              eq(taskSubtask.taskId, targetId),
              inArray(
                taskSubtask.id,
                children.map((child) => child.id),
              ),
              sql`exists (select 1 from ${task} where ${task.id} = ${sourceId} and ${task.userId} = ${userId})`,
            ),
          )
          .returning({ id: taskSubtask.id })
      : null;
  const rollbackInsertedSubtaskQuery = database
    .delete(taskSubtask)
    .where(
      and(
        eq(taskSubtask.id, demotedSubtaskId),
        eq(taskSubtask.taskId, targetId),
        sql`exists (select 1 from ${task} where ${task.id} = ${sourceId} and ${task.userId} = ${userId})`,
      ),
    )
    .returning({ id: taskSubtask.id });
  const batchQueries = [
    insertSubtaskQuery,
    ...(moveChildrenQuery ? [moveChildrenQuery] : []),
    deleteSourceQuery,
    ...(restoreChildrenQuery ? [restoreChildrenQuery] : []),
    rollbackInsertedSubtaskQuery,
  ] as const;
  // Moving descendants, deleting the source, and rollback compensation are atomic as a batch.
  const batchResults = await database.batch(batchQueries);
  const [created] = batchResults[0];
  const deletedSource = batchResults[moveChildrenQuery ? 2 : 1];
  if (!deletedSource.length) {
    throw new Error("Task could not be moved.");
  }
  revalidatePath("/tasks");
  return { ...created, reminderAt: created.reminderAt?.toISOString() ?? null };
}

export async function createTaskSubtask(
  input: unknown,
): Promise<TaskSubtaskRecord> {
  const values = subtaskInputSchema.parse(input);
  const userId = await getUserId();
  await ensureOwnedTask(values.taskId, userId);
  const [created] = await getDatabase()
    .insert(taskSubtask)
    .values({
      id: crypto.randomUUID(),
      taskId: values.taskId,
      title: values.title,
      description: values.description?.trim() || null,
      notes: values.notes?.trim() || null,
      project: values.project,
      labels: values.labels ?? [],
      scheduledDate: values.scheduledDate,
      dueDate: values.dueDate,
      reminderAt: values.reminderAt ? new Date(values.reminderAt) : null,
      location: values.location || null,
      priority: values.priority,
    })
    .returning({
      id: taskSubtask.id,
      taskId: taskSubtask.taskId,
      title: taskSubtask.title,
      description: taskSubtask.description,
      notes: taskSubtask.notes,
      project: taskSubtask.project,
      labels: taskSubtask.labels,
      scheduledDate: taskSubtask.scheduledDate,
      dueDate: taskSubtask.dueDate,
      reminderAt: taskSubtask.reminderAt,
      location: taskSubtask.location,
      priority: taskSubtask.priority,
      completed: taskSubtask.completed,
    });

  revalidatePath("/tasks");
  return { ...created, reminderAt: created.reminderAt?.toISOString() ?? null };
}

export async function setTaskSubtaskCompleted(
  taskId: string,
  subtaskId: string,
  completed: boolean,
): Promise<void> {
  const parentId = z.uuid().parse(taskId);
  const childId = z.uuid().parse(subtaskId);
  const isCompleted = z.boolean().parse(completed);
  const userId = await getUserId();
  await ensureOwnedTask(parentId, userId);
  const [updated] = await getDatabase()
    .update(taskSubtask)
    .set({ completed: isCompleted })
    .where(and(eq(taskSubtask.id, childId), eq(taskSubtask.taskId, parentId)))
    .returning({ id: taskSubtask.id });

  if (!updated) {
    throw new Error("Subtask was not found for this task.");
  }

  revalidatePath("/tasks");
}

export async function deleteTaskSubtask(
  taskId: string,
  subtaskId: string,
): Promise<void> {
  const parentId = z.uuid().parse(taskId);
  const childId = z.uuid().parse(subtaskId);
  const userId = await getUserId();
  await ensureOwnedTask(parentId, userId);
  const [deleted] = await getDatabase()
    .delete(taskSubtask)
    .where(and(eq(taskSubtask.id, childId), eq(taskSubtask.taskId, parentId)))
    .returning({ id: taskSubtask.id });

  if (!deleted) {
    throw new Error("Subtask was not found for this task.");
  }

  revalidatePath("/tasks");
}

async function ensureOwnedTask(taskId: string, userId: string) {
  const [ownedTask] = await getDatabase()
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    .limit(1);

  if (!ownedTask) {
    throw new Error("Task was not found for the signed-in account.");
  }
}

export async function setTaskCompleted(
  taskId: string,
  completed: boolean,
): Promise<void> {
  const id = z.uuid().parse(taskId);
  const userId = await getUserId();
  const [updated] = await getDatabase()
    .update(task)
    .set({ completed })
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .returning({ id: task.id });

  if (!updated) {
    throw new Error("Task was not found for the signed-in account.");
  }

  revalidatePath("/tasks");
}

export async function autoScheduleTasks(): Promise<
  { id: string; scheduledDate: string | null }[]
> {
  const userId = await getUserId();
  const database = getDatabase();
  const unscheduledTasks = await database
    .select({ id: task.id })
    .from(task)
    .where(
      and(
        eq(task.userId, userId),
        eq(task.completed, false),
        isNull(task.scheduledDate),
      ),
    )
    .orderBy(asc(task.priority), asc(task.createdAt));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateCases = unscheduledTasks.map((item, index) => {
    const scheduledDate = new Date(today);
    scheduledDate.setUTCDate(today.getUTCDate() + index);
    return sql`when ${item.id} then ${scheduledDate.toISOString().slice(0, 10)}::date`;
  });
  const changedTasks =
    unscheduledTasks.length > 0
      ? await database
          .update(task)
          .set({
            scheduledDate: sql`case ${task.id} ${sql.join(dateCases, sql` `)} else ${task.scheduledDate} end`,
          })
          .where(
            and(
              eq(task.userId, userId),
              eq(task.completed, false),
              isNull(task.scheduledDate),
              inArray(
                task.id,
                unscheduledTasks.map((item) => item.id),
              ),
            ),
          )
          .returning({ id: task.id, scheduledDate: task.scheduledDate })
      : [];

  if (changedTasks.length > 0) {
    revalidatePath("/tasks");
  }

  return changedTasks;
}
