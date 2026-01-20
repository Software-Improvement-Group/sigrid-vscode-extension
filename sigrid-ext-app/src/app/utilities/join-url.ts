export function joinUrl(url: string, ...paths: string[]): string {
  const path = paths.join('/');
  return new URL(path, url).toString();
}
