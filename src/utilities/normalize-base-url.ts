export function normalizeBaseUrl(rawUrl: string): string {
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}
