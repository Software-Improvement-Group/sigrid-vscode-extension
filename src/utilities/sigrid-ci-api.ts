const SIGRID_API_BASE_RELATIVE_URL = 'rest/analysis-results/api/v1';

export function buildSigridApiBaseUrl(sigridUrl: string): string {
    return `${sigridUrl.replace(/\/+$/, '')}/${SIGRID_API_BASE_RELATIVE_URL}`;
}

export function buildLicensesUrl(sigridUrl: string, customer: string): string {
    return `${buildSigridApiBaseUrl(sigridUrl)}/licenses/${encodeURIComponent(customer)}`;
}

export function buildSigridCiUrl(sigridUrl: string, customer: string, system: string): string {
    const base = sigridUrl.replace(/\/+$/, '');
    return `${base}/rest/analysis-results/sigridci/${encodeURIComponent(customer)}/${encodeURIComponent(system)}/v1/ci`;
}

export function buildCiUploadUrl(sigridUrl: string, customer: string, system: string): string {
    const base = sigridUrl.replace(/\/+$/, '');
    return `${base}/rest/inboundresults/sig/${encodeURIComponent(customer)}/${encodeURIComponent(system)}/ci/uploads/v1`;
}

export function buildBearerAuthHeader(apiKey: string): string {
    return `Bearer ${apiKey}`;
}
