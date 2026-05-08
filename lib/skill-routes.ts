export function getSkillSourcePath(slug: string) {
  return `/skills/${encodeURIComponent(slug)}/source`;
}

export function getSkillDownloadPath(slug: string) {
  return `/skills/${encodeURIComponent(slug)}/download`;
}
