export function toDisplayFilePath(path: string | null | undefined, prefix = '.../'): string {
  if (!path) return '';

  const lastPathSegment = path.split('/').at(-1);

  return lastPathSegment ? `${prefix}${lastPathSegment}` : '';
}

export function getParentDirectory(path: string | null | undefined): string {
  if (!path) return '';

  return path.substring(0, path.lastIndexOf('/'));
}
