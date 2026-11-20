export type ProjectStatus = "active" | "completed" | "archived";

export type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  lifeDomains: string[];
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  status: ProjectStatus;
  color: string;
};

export type ProjectDraft = {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  targetDate: string | null;
  progress: number;
  color: string;
};

export type CreateProjectInput = {
  id: string;
  name: string;
  description: string | null;
  lifeDomains: string[];
  startDate: string | null;
  targetDate: string | null;
};
