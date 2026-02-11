export function toDisplayFilePath(path: string | null | undefined, prefix = '.../'): string {
  if (!path) return '';

  const lastPathSegment = path.split('/').at(-1) ?? '';

  return lastPathSegment ? `${prefix}${lastPathSegment}` : '';
}
