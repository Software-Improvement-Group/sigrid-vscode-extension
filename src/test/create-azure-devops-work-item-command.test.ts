import * as assert from 'assert';
import * as vscode from 'vscode';
import { CreateAzureDevOpsWorkItemCommand } from '../commands/create-azure-devops-work-item-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

interface AzureDevOpsConfig {
    azureDevOpsOrganizationUrl: string;
    azureDevOpsPersonalAccessToken: string;
    azureDevOpsProjectName: string;
    customer: string;
}

const DEFAULT_CONFIG: AzureDevOpsConfig = {
    azureDevOpsOrganizationUrl: 'https://dev.azure.com/myorg/',
    azureDevOpsPersonalAccessToken: 'pat-token',
    azureDevOpsProjectName: 'MyProject',
    customer: '',
};

function setupConfig(overrides: Partial<AzureDevOpsConfig> = {}) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    (vscode.workspace as any).getConfiguration = () => ({
        get: (key: string, defaultValue: any) => (config as any)[key] ?? defaultValue,
    });
}

function setupDefaultMocks() {
    (vscode.window as any).showInformationMessage = (_message: string, option: string) => Promise.resolve(option as any);
    (vscode.window as any).showErrorMessage = (_message: string) => Promise.resolve(undefined);
    (vscode.env as any).openExternal = async (_uri: vscode.Uri) => true;
}

async function executeCommand(payload: { title: string; workItemType: string; findings: any[]; sigridUrl: string } =
    { title: 'Test', workItemType: 'Task', findings: [], sigridUrl: 'https://sigrid.example.com' }) {
    const command = new CreateAzureDevOpsWorkItemCommand();
    await command.execute(new VsCodeCommandData({} as any, {} as any, payload));
}

suite('CreateAzureDevOpsWorkItemCommand', () => {
    let originalShowErrorMessage: any;
    let originalShowInformationMessage: any;
    let originalGetConfiguration: any;
    let originalOpenExternal: any;
    let originalFetch: any;

    setup(() => {
        originalShowErrorMessage = (vscode.window as any).showErrorMessage;
        originalShowInformationMessage = (vscode.window as any).showInformationMessage;
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalOpenExternal = (vscode.env as any).openExternal;
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        (vscode.env as any).openExternal = originalOpenExternal;
        globalThis.fetch = originalFetch;
    });

    test('shows an error when Azure DevOps settings are incomplete', async () => {
        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        (vscode.workspace as any).getConfiguration = () => ({
            get: (_key: string, defaultValue: any) => defaultValue,
        });

        let fetchCalled = false;
        globalThis.fetch = async () => {
            fetchCalled = true;
            return {} as any;
        };

        await executeCommand();

        assert.strictEqual(fetchCalled, false);
        assert.strictEqual(errorMessage, 'Azure DevOps settings are incomplete. Please configure the organization URL, personal access token, and project name in the extension settings.');
    });

    test('creates a work item and opens it in the browser on success', async () => {
        setupConfig();
        setupDefaultMocks();

        let requestedUrl = '';
        let requestedBody = '';
        let requestedHeaders: any = {};
        let openedUri = '';
        (vscode.env as any).openExternal = async (uri: vscode.Uri) => {
            openedUri = uri.toString(true);
            return true;
        };

        globalThis.fetch = async (input: any, init: any) => {
            requestedUrl = input.toString();
            requestedBody = init.body;
            requestedHeaders = init.headers;
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 131489, _links: { html: { href: 'https://dev.azure.com/myorg/web/wi.aspx?id=131489' } } }),
                text: async () => '',
            } as any;
        };

        await executeCommand({
            title: 'Refactor component',
            workItemType: 'Task',
            findings: [{ emoji: '⚠️', title: 'Duplicate code', fileLocations: [{ filePath: 'src/foo.ts', startLine: 24 }] }],
            sigridUrl: 'https://sigrid.example.com',
        });

        assert.strictEqual(requestedUrl, 'https://dev.azure.com/myorg/MyProject/_apis/wit/workitems/$Task?api-version=7.1');
        assert.strictEqual(requestedHeaders['Authorization'], 'Basic ' + Buffer.from(':pat-token').toString('base64'));

        const body = JSON.parse(requestedBody);
        assert.strictEqual(body[0].path, '/fields/System.Title');
        assert.strictEqual(body[0].value, 'Refactor component');
        assert.strictEqual(body[1].path, '/fields/System.Description');
        assert.ok(body[1].value.includes('<h2>Code selected for refactoring</h2>'));
        assert.ok(body[1].value.includes('src/foo.ts:24'));
        assert.strictEqual(openedUri, 'https://dev.azure.com/myorg/web/wi.aspx?id=131489');
    });

    test('prepends https:// to the organization URL when no protocol is present', async () => {
        setupConfig({ azureDevOpsOrganizationUrl: 'dev.azure.com/myorg' });
        setupDefaultMocks();

        let requestedUrl = '';
        globalThis.fetch = async (input: any) => {
            requestedUrl = input.toString();
            return { ok: true, status: 200, json: async () => ({ id: 1, _links: { html: { href: '' } } }), text: async () => '' } as any;
        };

        await executeCommand();

        assert.strictEqual(requestedUrl, 'https://dev.azure.com/myorg/MyProject/_apis/wit/workitems/$Task?api-version=7.1');
    });

    test('accepts the legacy visualstudio.com organization URL form unchanged', async () => {
        setupConfig({ azureDevOpsOrganizationUrl: 'https://myorg.visualstudio.com' });
        setupDefaultMocks();

        let requestedUrl = '';
        globalThis.fetch = async (input: any) => {
            requestedUrl = input.toString();
            return { ok: true, status: 200, json: async () => ({ id: 1, _links: { html: { href: '' } } }), text: async () => '' } as any;
        };

        await executeCommand();

        assert.strictEqual(requestedUrl, 'https://myorg.visualstudio.com/MyProject/_apis/wit/workitems/$Task?api-version=7.1');
    });

    test('HTML-escapes finding titles and file paths in the description', async () => {
        setupConfig();
        setupDefaultMocks();

        let requestedBody = '';
        globalThis.fetch = async (_input: any, init: any) => {
            requestedBody = init.body;
            return { ok: true, status: 200, json: async () => ({ id: 1, _links: { html: { href: '' } } }), text: async () => '' } as any;
        };

        await executeCommand({
            title: 'Test',
            workItemType: 'Task',
            findings: [{ emoji: '⚠️', title: '<script>alert(1)</script>', fileLocations: [{ filePath: 'src/<evil>.ts' }] }],
            sigridUrl: 'https://sigrid.example.com',
        });

        const body = JSON.parse(requestedBody);
        assert.ok(!body[1].value.includes('<script>alert(1)</script>'));
        assert.ok(body[1].value.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
        assert.ok(body[1].value.includes('src/&lt;evil&gt;.ts'));
    });

    test('shows an error message when the API call fails', async () => {
        setupConfig();
        setupDefaultMocks();

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => 'Unauthorized' } as any);

        await executeCommand();

        assert.ok(errorMessage.includes('Failed to create Azure DevOps work item (401)'));
    });
});
