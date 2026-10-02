import * as assert from 'assert';
import * as vscode from 'vscode';
import { SigridApiRequestCommand } from '../commands/sigrid-api-request-command';
import { SigridApiRequest } from '../utilities/sigrid-api-client';
import { VsCodeCommandData } from '../commands/vscode-command-data';

const CONFIG: Record<string, string> = {
    customer: 'acme',
    system: 'my system',
    sigridUrl: 'https://sigrid-says.com/',
};

function createSecretsStub(apiKey = 'api-key'): vscode.SecretStorage {
    return { get: async () => apiKey } as unknown as vscode.SecretStorage;
}

function createFakeWebview() {
    const messages: any[] = [];
    return {
        webview: { postMessage: (message: any) => { messages.push(message); return Promise.resolve(true); } } as any,
        messages,
    };
}

async function execute(request: SigridApiRequest, webview: any) {
    await new SigridApiRequestCommand().execute(new VsCodeCommandData(webview, {} as any, request, createSecretsStub()));
}

function fakeResponse(status: number, text: string) {
    return { ok: status < 400, status, text: async () => text } as any;
}

suite('SigridApiRequestCommand', () => {
    let originalGetConfiguration: any;
    let originalFetch: any;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalFetch = globalThis.fetch;
        (vscode.workspace as any).getConfiguration = () => ({
            get: (key: string, defaultValue: any) => CONFIG[key] ?? defaultValue,
        });
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        globalThis.fetch = originalFetch;
    });

    test('calls the Sigrid API with customer, system and bearer token and posts the parsed body', async () => {
        let calledUrl = '';
        let calledInit: any;
        globalThis.fetch = async (url: any, init: any) => {
            calledUrl = url;
            calledInit = init;
            return fakeResponse(200, '{"refactoringCandidates":[]}');
        };
        const { webview, messages } = createFakeWebview();

        await execute({ requestId: 'r1', method: 'GET', path: ['refactoring-candidates', 'duplication'] }, webview);

        assert.strictEqual(calledUrl, 'https://sigrid-says.com/rest/analysis-results/api/v1/refactoring-candidates/acme/my%20system/duplication');
        assert.strictEqual(calledInit.method, 'GET');
        assert.strictEqual(calledInit.headers.Authorization, 'Bearer api-key');
        assert.deepStrictEqual(messages, [{
            command: 'sigridApiResponse',
            data: { requestId: 'r1', status: 200, body: { refactoringCandidates: [] } },
        }]);
    });

    test('sends the body as JSON for PATCH requests', async () => {
        let calledInit: any;
        globalThis.fetch = async (_url: any, init: any) => {
            calledInit = init;
            return fakeResponse(204, '');
        };
        const { webview, messages } = createFakeWebview();

        await execute({ requestId: 'r2', method: 'PATCH', path: ['findings', 'f-1'], body: { status: 'ACCEPTED' } }, webview);

        assert.strictEqual(calledInit.headers['Content-Type'], 'application/json');
        assert.strictEqual(calledInit.body, '{"status":"ACCEPTED"}');
        assert.deepStrictEqual(messages[0].data, { requestId: 'r2', status: 204, body: undefined });
    });

    test('passes non-2xx statuses through to the webview', async () => {
        globalThis.fetch = async () => fakeResponse(401, 'Unauthorized');
        const { webview, messages } = createFakeWebview();

        await execute({ requestId: 'r3', method: 'GET', path: ['osh-findings'] }, webview);

        assert.strictEqual(messages[0].data.status, 401);
    });

    test('reports status 0 when the request fails', async () => {
        globalThis.fetch = async () => { throw new Error('network down'); };
        const { webview, messages } = createFakeWebview();

        await execute({ requestId: 'r4', method: 'GET', path: ['security-findings'] }, webview);

        assert.deepStrictEqual(messages[0].data, { requestId: 'r4', status: 0 });
    });

    test('rejects resources and methods that are not allowed without calling fetch', async () => {
        let fetchCalled = false;
        globalThis.fetch = async () => { fetchCalled = true; return fakeResponse(200, ''); };
        const { webview, messages } = createFakeWebview();

        await execute({ requestId: 'r5', method: 'GET', path: ['licenses'] }, webview);
        await execute({ requestId: 'r6', method: 'DELETE' as any, path: ['findings', 'f-1'] }, webview);
        await execute({ requestId: 'r7', method: 'GET', path: ['findings', ''] }, webview);

        assert.strictEqual(fetchCalled, false);
        assert.deepStrictEqual(messages.map(m => m.data.status), [0, 0, 0]);
    });
});
