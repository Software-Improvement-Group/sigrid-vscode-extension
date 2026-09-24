import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { OnboardSystemCommand } from '../commands/onboard-system-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';
import { setWorkspaceFolders } from './test-helpers';

interface SigridConfig {
    customer: string;
    system: string;
    subsystem: string;
    sigridUrl: string;
}

const DEFAULT_CONFIG: SigridConfig = {
    customer: 'acme',
    system: 'my-system',
    subsystem: '',
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

function setupWorkspaceFolder(workspaceRoot: string | undefined) {
    setWorkspaceFolders(workspaceRoot ? [{ uri: { fsPath: workspaceRoot } }] as any : undefined);
}

function createFakeWebview() {
    const messages: any[] = [];
    return {
        webview: { postMessage: (message: any) => { messages.push(message); return Promise.resolve(true); } } as any,
        messages,
    };
}

interface FetchStageOverrides {
    licenses?: { ok?: boolean; status?: number; body?: any; text?: string };
    onboard?: { ok?: boolean; status?: number; body?: any; text?: string };
    upload?: { ok?: boolean; status?: number; text?: string };
}

function setupFetch(overrides: FetchStageOverrides = {}) {
    const requests: Array<{ url: string; init: any }> = [];

    globalThis.fetch = async (input: any, init: any) => {
        const url = input.toString();
        requests.push({ url, init });

        if (url.includes('/licenses/')) {
            const stage = overrides.licenses ?? {};
            return {
                ok: stage.ok ?? true,
                status: stage.status ?? 200,
                json: async () => stage.body ?? { licenses: ['MAINTAINABILITY', 'SECURITY', 'SOME_UNKNOWN_CAPABILITY'] },
                text: async () => stage.text ?? '',
            } as any;
        }

        if (url.includes('/ci/uploads/v1')) {
            const stage = overrides.onboard ?? {};
            return {
                ok: stage.ok ?? true,
                status: stage.status ?? 200,
                json: async () => stage.body ?? { uploadUrl: 'https://upload.example.com/put' },
                text: async () => stage.text ?? '',
            } as any;
        }

        const stage = overrides.upload ?? {};
        return {
            ok: stage.ok ?? true,
            status: stage.status ?? 200,
            text: async () => stage.text ?? '',
        } as any;
    };

    return requests;
}

async function executeCommand(webview: any) {
    const command = new OnboardSystemCommand();
    await command.execute(new VsCodeCommandData(webview, {} as any, undefined, createSecretsStub()));
}

suite('OnboardSystemCommand', () => {
    let originalGetConfiguration: any;
    let originalWorkspaceFolders: any;
    let originalFetch: any;
    let originalShowErrorMessage: any;
    let workspaceRoot: string;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalWorkspaceFolders = (vscode.workspace as any).workspaceFolders;
        originalFetch = globalThis.fetch;
        originalShowErrorMessage = (vscode.window as any).showErrorMessage;
        (vscode.window as any).showErrorMessage = () => Promise.resolve(undefined);

        workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'onboard-system-test-'));
        fs.writeFileSync(path.join(workspaceRoot, 'index.ts'), 'export const a = 1;');

        setupConfig();
        setupWorkspaceFolder(workspaceRoot);
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        setWorkspaceFolders(originalWorkspaceFolders);
        globalThis.fetch = originalFetch;
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
    });

    test('posts { success: false } with a message when no workspace folder is open', async () => {
        setupWorkspaceFolder(undefined);
        setupFetch();

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.deepStrictEqual(messages[0], {
            command: 'onboardSystemResult',
            data: { success: false, error: 'No workspace folder is open.' },
        });
    });

    test('posts { success: false } when fetching licenses fails', async () => {
        const requests = setupFetch({ licenses: { ok: false, status: 500, text: 'boom' } });

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.strictEqual(messages[0].command, 'onboardSystemResult');
        assert.strictEqual(messages[0].data.success, false);
        assert.ok(messages[0].data.error.includes('500'));
        assert.strictEqual(requests.length, 1);
    });

    test('posts { success: false } when the onboarding request fails', async () => {
        setupFetch({ onboard: { ok: false, status: 400, text: 'bad request' } });

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.strictEqual(messages[0].data.success, false);
        assert.ok(messages[0].data.error.includes('400'));
    });

    test('posts { success: false } when the archive upload fails', async () => {
        setupFetch({ upload: { ok: false, status: 403, text: 'forbidden' } });

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.strictEqual(messages[0].data.success, false);
        assert.ok(messages[0].data.error.includes('403'));
    });

    test('filters licenses to the known capabilities before requesting onboarding', async () => {
        const requests = setupFetch();

        const { webview } = createFakeWebview();
        await executeCommand(webview);

        const onboardRequest = requests.find(r => r.url.includes('/ci/uploads/v1'));
        const body = JSON.parse(onboardRequest!.init.body);
        assert.deepStrictEqual(body.capabilities, ['MAINTAINABILITY', 'SECURITY']);
        assert.strictEqual(body.mode, 'ONBOARDING');
        assert.strictEqual(body.subsystem, null);
    });

    test('posts { success: true } on the full happy path', async () => {
        setupFetch();

        const { webview, messages } = createFakeWebview();
        await executeCommand(webview);

        assert.deepStrictEqual(messages[0], { command: 'onboardSystemResult', data: { success: true } });
    });
});
