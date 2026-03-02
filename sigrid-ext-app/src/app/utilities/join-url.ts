export function joinUrl(url: string, ...paths: string[]): string {
  const normalizedUrl = url.replace(/\/+$/g, '');
  const path = paths.map(p => p.replace(/^\/+|\/+$/g, '')).join('/');
  return new URL(`${normalizedUrl}/${path}`).toString();
}
