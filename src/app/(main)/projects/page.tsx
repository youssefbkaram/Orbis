import { redirect } from "next/navigation";
import { ProjectsWorkspace } from "@/components/pages/projects/ProjectsWorkspace";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { project } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export default async function ProjectsPage() {
  const session = await getServerSession();

  if (!session) redirect("/sign-in");
  if (!db) throw new Error("The projects database is not configured.");

  const projects = await db
    .select({
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
    })
    .from(project)
    .where(eq(project.userId, session.user.id))
    .orderBy(asc(project.targetDate), asc(project.createdAt));

  return <ProjectsWorkspace initialProjects={projects} />;
}
