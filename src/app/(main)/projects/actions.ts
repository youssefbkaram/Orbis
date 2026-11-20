"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  CreateProjectInput,
  ProjectRecord,
  ProjectStatus,
} from "@/components/pages/projects/types";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { project } from "@/lib/db/schema";

const projectIdSchema = z.uuid();
const projectDraftSchema = z.object({
  id: projectIdSchema,
  name: z.string().trim().min(1, "Project name is required.").max(140),
  description: z.string().trim().max(4000).nullable(),
  domain: z.string().trim().max(80).nullable(),
  targetDate: z.iso.date().nullable(),
  progress: z.number().int().min(0).max(100),
  color: z.enum([
    "#2563eb",
    "#0f766e",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#475569",
  ]),
});
const lifeDomainOptions = [
  "Academics & Education",
  "Projects & Work",
  "Personal Development",
  "Relationships & Social Life",
  "Health & Lifestyle",
  "Personal Life & Vision",
] as const;
const createProjectSchema = z.object({
  id: projectIdSchema,
  name: z.string().trim().min(1, "Project name is required.").max(120),
  description: z.string().trim().max(4000).nullable(),
  lifeDomains: z
    .array(z.enum(lifeDomainOptions))
    .max(lifeDomainOptions.length)
    .refine((values) => new Set(values).size === values.length),
  startDate: z.iso.date().nullable(),
  targetDate: z.iso.date().nullable(),
}).refine(
  (values) => !values.startDate || !values.targetDate || values.targetDate >= values.startDate,
  { message: "Target date cannot be before the start date.", path: ["targetDate"] },
);
const projectStatusSchema = z.enum(["active", "completed", "archived"]);

async function getProjectContext() {
  const session = await getServerSession();
  if (!session) throw new Error("You must be signed in to manage projects.");
  if (!db) throw new Error("The projects database is not configured.");
  return { database: db, userId: session.user.id };
}

export async function createProject(input: unknown): Promise<ProjectRecord> {
  const values: CreateProjectInput = createProjectSchema.parse(input);
  const { database, userId } = await getProjectContext();
  const [created] = await database
    .insert(project)
    .values({
      ...values,
      domain: values.lifeDomains[0] ?? null,
      userId,
    })
    .returning({
      id: project.id,
      name: project.name,
      description: project.description,
      domain: project.domain,
      lifeDomains: project.lifeDomains,
      startDate: project.startDate,
      targetDate: project.targetDate,
      progress: project.progress,
      status: project.status,
      color: project.color,
    });

  revalidatePath("/projects");
  return created;
}

export async function updateProject(input: unknown): Promise<ProjectRecord> {
  const values = projectDraftSchema.parse(input);
  const { database, userId } = await getProjectContext();
  const { id, ...draft } = values;
  const [updated] = await database
    .update(project)
    .set({
      ...draft,
      progress: sql`case when ${project.status} = 'completed' then 100 else ${draft.progress} end`,
    })
    .where(and(eq(project.id, id), eq(project.userId, userId)))
    .returning({
      id: project.id,
      name: project.name,
      description: project.description,
      domain: project.domain,
      lifeDomains: project.lifeDomains,
      startDate: project.startDate,
      targetDate: project.targetDate,
      progress: project.progress,
      status: project.status,
      color: project.color,
    });

  if (!updated) throw new Error("Project was not found for the signed-in account.");
  revalidatePath("/projects");
  return updated;
}

export async function setProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Promise<ProjectRecord> {
  const id = projectIdSchema.parse(projectId);
  const nextStatus = projectStatusSchema.parse(status);
  const { database, userId } = await getProjectContext();
  const [updated] = await database
    .update(project)
    .set({
      status: nextStatus,
      ...(nextStatus === "completed" ? { progress: 100 } : {}),
    })
    .where(and(eq(project.id, id), eq(project.userId, userId)))
    .returning({
      id: project.id,
      name: project.name,
      description: project.description,
      domain: project.domain,
      lifeDomains: project.lifeDomains,
      startDate: project.startDate,
      targetDate: project.targetDate,
      progress: project.progress,
      status: project.status,
      color: project.color,
    });

  if (!updated) throw new Error("Project was not found for the signed-in account.");
  revalidatePath("/projects");
  return updated;
}
