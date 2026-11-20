import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TasksWorkspace } from "@/components/pages/tasks/TasksWorkspace";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { task, taskSubtask } from "@/lib/db/schema";

export default async function TasksPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }
  if (!db) {
    throw new Error("The tasks database is not configured.");
  }

  const taskRows = await db
    .select({
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
      sortOrder: task.sortOrder,
    })
    .from(task)
    .where(eq(task.userId, session.user.id))
    .orderBy(task.completed, task.scheduledDate, task.sortOrder, task.createdAt);
  const tasks = taskRows.map((item) => ({
    ...item,
    reminderAt: item.reminderAt?.toISOString() ?? null,
  }));
  const subtaskRows = await db
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
    .innerJoin(task, eq(task.id, taskSubtask.taskId))
    .where(eq(task.userId, session.user.id))
    .orderBy(
      asc(taskSubtask.sortOrder),
      asc(taskSubtask.createdAt),
      asc(taskSubtask.id),
    );
  const subtasks = subtaskRows.map((item) => ({
    ...item,
    reminderAt: item.reminderAt?.toISOString() ?? null,
  }));

  return (
    <TasksWorkspace
      initialTasks={tasks}
      initialSubtasks={subtasks}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
