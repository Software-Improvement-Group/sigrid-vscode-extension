import { SecretStorage } from "vscode";
import { getSigridConfiguration } from "./configuration";
import { SECRET_KEYS } from "./secrets";
import { getSecret } from "./scoped-secrets";
import { buildBearerAuthHeader, buildSigridApiBaseUrl } from "./sigrid-ci-api";

export type SigridApiMethod = 'GET' | 'PATCH';

export interface SigridApiRequest {
    requestId: string;
    method: SigridApiMethod;
    /** Resource name followed by optional extra segments, e.g. ['refactoring-candidates', 'duplication']. */
    path: string[];
    body?: unknown;
}

export interface SigridApiResponse {
    requestId: string;
    /** 0 means the request never got a response (network failure or rejected request). */
    status: number;
    body?: unknown;
}

const ALLOWED_RESOURCES = ['osh-findings', 'security-findings', 'refactoring-candidates', 'findings'];
const ALLOWED_METHODS: SigridApiMethod[] = ['GET', 'PATCH'];

export async function callSigridApi(request: SigridApiRequest, secrets: SecretStorage): Promise<SigridApiResponse> {
    if (!isAllowedRequest(request)) {
        console.error('Rejected Sigrid API request:', request.method, request.path);
        return { requestId: request.requestId, status: 0 };
    }

    try {
        const apiKey = await getSecret(secrets, SECRET_KEYS.apiKey) ?? '';
        const response = await fetch(buildRequestUrl(request.path), buildRequestInit(request, apiKey));
        return { requestId: request.requestId, status: response.status, body: await readBody(response) };
    } catch (error) {
        console.error('Sigrid API request failed:', error);
        return { requestId: request.requestId, status: 0 };
    }
}

function isAllowedRequest(request: SigridApiRequest): boolean {
    const [resource, ...segments] = Array.isArray(request.path) ? request.path : [];
    return ALLOWED_METHODS.includes(request.method)
        && ALLOWED_RESOURCES.includes(resource)
        && segments.every(segment => typeof segment === 'string' && segment.length > 0);
}

function buildRequestUrl(path: string[]): string {
    const config = getSigridConfiguration();
    const [resource, ...segments] = path;
    const encoded = [resource, config.customer, config.system, ...segments].map(encodeURIComponent);
    return `${buildSigridApiBaseUrl(config.sigridUrl)}/${encoded.join('/')}`;
}

function buildRequestInit(request: SigridApiRequest, apiKey: string): RequestInit {
    const headers: Record<string, string> = { 'Authorization': buildBearerAuthHeader(apiKey) };
    if (request.body === undefined) {
        return { method: request.method, headers };
    }
    headers['Content-Type'] = 'application/json';
    return { method: request.method, headers, body: JSON.stringify(request.body) };
}

async function readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}
