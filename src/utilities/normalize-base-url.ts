export function normalizeBaseUrl(rawUrl: string): string {
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (url && !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
        url = 'https://' + url;
    }
    return url;
}
