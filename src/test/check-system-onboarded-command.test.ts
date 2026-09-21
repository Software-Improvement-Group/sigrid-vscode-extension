import * as assert from 'assert';
import * as vscode from 'vscode';
import { CheckSystemOnboardedCommand } from '../commands/check-system-onboarded-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

interface SigridConfig {
    customer: string;
    system: string;
    sigridUrl: string;
}

const DEFAULT_CONFIG: SigridConfig = {
    customer: 'acme',
    system: 'my-system',
    sigridUrl: 'https://sigrid-says.com',
};

function setupConfig(overrides: Partial<SigridConfig> = {}) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    (vscode.workspace as any).getConfiguration = () => ({
        get: (key: string, defaultValue: any) => (config as any)[key] ?? defaultValue,
    });
}

function createSecretsStub(apiKey: string | undefined = 'api-key'): vscode.SecretStorage {
    return { get: async () => apiKey } as unknown as vscode.SecretStorage;
}

function createFakeWebview() {
    const messages: any[] = [];
    return {
        webview: { postMessage: (message: any) => { messages.push(message); return Promise.resolve(true); } } as any,
        messages,
    };
}

async function executeCommand(webview: any) {
    const command = new CheckSystemOnboardedCommand();
    await command.execute(new VsCodeCommandData(webview, {} as any, undefined, createSecretsStub()));
}

suite('CheckSystemOnboardedCommand', () => {
    let originalGetConfiguration: any;
    let originalFetch: any;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalFetch = globalThis.fetch;
        setupConfig();
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        globalThis.fetch = originalFetch;
    });

    test('posts status "onboarded" when the check request succeeds', async () => {
        globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '' } as any);

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.strictEqual(messages.length, 1);
        assert.deepStrictEqual(messages[0], { command: 'systemOnboardStatus', data: { status: 'onboarded' } });
    });

    test('posts status "not-onboarded" when the check request returns 404', async () => {
        globalThis.fetch = async () => ({ ok: false, status: 404, text: async () => '' } as any);

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.deepStrictEqual(messages[0], { command: 'systemOnboardStatus', data: { status: 'not-onboarded' } });
    });

    test('posts status "error" with a message when the check request fails unexpectedly', async () => {
        globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' } as any);

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.strictEqual(messages[0].command, 'systemOnboardStatus');
        assert.strictEqual(messages[0].data.status, 'error');
        assert.ok(messages[0].data.message.includes('500'));
    });

    test('posts status "error" when fetch throws', async () => {
        globalThis.fetch = async () => { throw new Error('network down'); };

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.deepStrictEqual(messages[0], { command: 'systemOnboardStatus', data: { status: 'error', message: 'network down' } });
    });
});
