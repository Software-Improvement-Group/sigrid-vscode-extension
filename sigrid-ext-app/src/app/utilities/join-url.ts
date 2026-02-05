export function joinUrl(url: string, ...paths: string[]): string {
  const path = paths.map(p => p.replace(/^\/+|\+$/g, '')).join('/');
  return new URL(path, url).toString();
}
