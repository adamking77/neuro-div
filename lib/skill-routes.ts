export function getSkillSourceApiPath(slug: string) {
  return `/api/skills-source?slug=${encodeURIComponent(slug)}`;
}

export function getSkillBundleApiPath(slug: string) {
  return `/api/skills-bundle?slug=${encodeURIComponent(slug)}`;
}
