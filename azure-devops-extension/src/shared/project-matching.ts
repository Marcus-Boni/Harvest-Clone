import type { Project } from "./types";

function normalizeProjectToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function buildProjectTokens(project: Project): string[] {
  return [project.name, project.code]
    .filter(Boolean)
    .map(normalizeProjectToken)
    .filter(Boolean);
}

export function resolveProjectIdFromDevOpsContext(
  projects: Project[],
  devOpsProjectName: string,
): string {
  if (projects.length === 0) return "";
  if (!devOpsProjectName) return projects[0]?.id ?? "";

  const normalizedDevOpsProject = normalizeProjectToken(devOpsProjectName);
  if (!normalizedDevOpsProject) return projects[0]?.id ?? "";

  const exact = projects.find((project) =>
    buildProjectTokens(project).some((token) => token === normalizedDevOpsProject),
  );
  if (exact) return exact.id;

  const partial = projects.find((project) =>
    buildProjectTokens(project).some(
      (token) =>
        token.includes(normalizedDevOpsProject) ||
        normalizedDevOpsProject.includes(token),
    ),
  );

  return partial?.id ?? projects[0]?.id ?? "";
}
