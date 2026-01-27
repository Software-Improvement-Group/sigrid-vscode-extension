export function toDisplayFilePath(path: string | null | undefined): string {
  if (!path) return '';

  const lastPathSegment = path.split('/').at(-1) ?? '';

  return lastPathSegment ? `.../${lastPathSegment}` : '';
}
