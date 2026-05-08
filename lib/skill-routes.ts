export function getSkillSourceApiPath(slug: string) {
  return `/api/skills-source?slug=${encodeURIComponent(slug)}`;
}

export function getSkillDownloadApiPath(slug: string) {
  return `/api/skills-download?slug=${encodeURIComponent(slug)}`;
}
