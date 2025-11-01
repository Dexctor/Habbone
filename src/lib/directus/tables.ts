const STORIES_CANDIDATES = [
  () => (process.env.STORIES_TABLE || '').trim(),
  () => 'usuarios_storie',
  () => 'usuarios_stories',
  () => 'Usuarios_storie',
  () => 'Usuarios_stories',
  () => 'Usuarios_Storie',
  () => 'Usuarios Storie',
] as const;

export function resolveStoriesTables(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const factory of STORIES_CANDIDATES) {
    const value = factory();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}
