export function toDisplayFilePath(path: string | null | undefined, prefix = '.../'): string {
  if (!path) return '';

  const lastPathSegment = path.split('/').at(-1);

  return lastPathSegment ? `${prefix}${lastPathSegment}` : '';
}

export function getFileName(path: string | null | undefined): string {
  return toDisplayFilePath(path, '');
}

export function getParentDirectory(path: string | null | undefined): string {
  if (!path) return '';

  return path.substring(0, path.lastIndexOf('/'));
}

export function normalizePath(path: string | null | undefined, component: string | null | undefined): string {
  if (!path) return '';
  if (!component) return path;

  return path.startsWith(`${component}/`) ? path.slice(component.length + 1) : path;
}
