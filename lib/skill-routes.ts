export function getSkillSourceApiPath(slug: string) {
  return `/api/skills-source?slug=${encodeURIComponent(slug)}`;
}
