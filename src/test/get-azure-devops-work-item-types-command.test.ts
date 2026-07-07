import * as assert from 'assert';
import * as vscode from 'vscode';
import { GetAzureDevOpsWorkItemTypesCommand } from '../commands/get-azure-devops-work-item-types-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

interface AzureDevOpsConfig {
    azureDevOpsOrganizationUrl: string;
    azureDevOpsPersonalAccessToken: string;
    azureDevOpsProjectName: string;
}

const DEFAULT_CONFIG: AzureDevOpsConfig = {
    azureDevOpsOrganizationUrl: 'https://dev.azure.com/myorg',
    azureDevOpsPersonalAccessToken: 'pat-token',
    azureDevOpsProjectName: 'MyProject',
};

const DEFAULT_TYPES = [
    { name: 'Task', isDisabled: false },
    { name: 'Bug', isDisabled: false },
    { name: 'Epic', isDisabled: false },
    { name: 'Test Case', isDisabled: false },
    { name: 'Test Plan', isDisabled: false },
    { name: 'Test Suite', isDisabled: false },
    { name: 'Old Type', isDisabled: true },
];

const DEFAULT_CATEGORIES = [
    {
        referenceName: 'Microsoft.EpicCategory',
        defaultWorkItemType: { name: 'Epic' },
        workItemTypes: [{ name: 'Epic' }],
    },
    {
        referenceName: 'Microsoft.TestCaseCategory',
        defaultWorkItemType: { name: 'Test Case' },
        workItemTypes: [{ name: 'Test Case' }],
    },
    {
        referenceName: 'Microsoft.HiddenCategory',
        defaultWorkItemType: { name: 'Test Plan' },
        workItemTypes: [{ name: 'Test Plan' }, { name: 'Test Suite' }, { name: 'Shared Steps' }],
    },
];

function setupConfig(overrides: Partial<AzureDevOpsConfig> = {}) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    (vscode.workspace as any).getConfiguration = () => ({
        get: (key: string, defaultValue: any) => (config as any)[key] ?? defaultValue,
    });
}

function createFakeWebview() {
    const messages: any[] = [];
    return {
        webview: { postMessage: (message: any) => { messages.push(message); return Promise.resolve(true); } } as any,
        messages,
    };
}

function setupFetch(types: any[] = DEFAULT_TYPES, categories: any[] = DEFAULT_CATEGORIES) {
    let fetchCount = 0;
    globalThis.fetch = async (input: any) => {
        fetchCount += 1;
        const url = input.toString();
        if (url.includes('/workitemtypecategories')) {
            return { ok: true, status: 200, json: async () => ({ value: categories }), text: async () => '' } as any;
        }
        return { ok: true, status: 200, json: async () => ({ value: types }), text: async () => '' } as any;
    };
    return () => fetchCount;
}

suite('GetAzureDevOpsWorkItemTypesCommand', () => {
    let originalGetConfiguration: any;
    let originalFetch: any;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        globalThis.fetch = originalFetch;
    });

    test('posts an error when settings are incomplete', async () => {
        (vscode.workspace as any).getConfiguration = () => ({
            get: (_key: string, defaultValue: any) => defaultValue,
        });

        const { webview, messages } = createFakeWebview();
        const command = new GetAzureDevOpsWorkItemTypesCommand();
        await command.execute(new VsCodeCommandData(webview, {} as any, undefined));

        assert.strictEqual(messages.length, 1);
        assert.strictEqual(messages[0].command, 'azureDevOpsWorkItemTypesLoaded');
        assert.ok(messages[0].data.error);
    });

    test('excludes hidden-category types, Epic, Test Case, and disabled types', async () => {
        setupConfig();
        setupFetch();

        const { webview, messages } = createFakeWebview();
        const command = new GetAzureDevOpsWorkItemTypesCommand();
        await command.execute(new VsCodeCommandData(webview, {} as any, undefined));

        assert.deepStrictEqual(messages[0].data.types, ['Task', 'Bug']);
    });

    test('falls back to only the disabled-type filter when the categories request fails', async () => {
        setupConfig();

        globalThis.fetch = async (input: any) => {
            const url = input.toString();
            if (url.includes('/workitemtypecategories')) {
                return { ok: false, status: 500, json: async () => ({}), text: async () => 'boom' } as any;
            }
            return { ok: true, status: 200, json: async () => ({ value: DEFAULT_TYPES }), text: async () => '' } as any;
        };

        const { webview, messages } = createFakeWebview();
        const command = new GetAzureDevOpsWorkItemTypesCommand();
        await command.execute(new VsCodeCommandData(webview, {} as any, undefined));

        assert.deepStrictEqual(messages[0].data.types, ['Task', 'Bug', 'Epic', 'Test Case', 'Test Plan', 'Test Suite']);
    });

    test('caches the result and does not refetch for the same settings', async () => {
        setupConfig();
        const getFetchCount = setupFetch();

        const { webview } = createFakeWebview();
        const command = new GetAzureDevOpsWorkItemTypesCommand();
        await command.execute(new VsCodeCommandData(webview, {} as any, undefined));
        await command.execute(new VsCodeCommandData(webview, {} as any, undefined));

        assert.strictEqual(getFetchCount(), 2);
    });
});
