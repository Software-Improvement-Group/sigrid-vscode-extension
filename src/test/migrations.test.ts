import * as assert from 'assert';
import * as vscode from 'vscode';
import { migrateCustomerToPortfolioName, migrateSecretsToSecretStorage } from '../utilities/migrations';
import { SECRET_KEYS } from '../utilities/secrets';
import { buildScopedKey } from '../utilities/scoped-secrets';

const TEST_WORKSPACE_URI = 'file:///test-workspace';

function mockOpenWorkspace() {
    const original = (vscode.workspace as any).workspaceFolders;
    (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.parse(TEST_WORKSPACE_URI) }];
    return () => { (vscode.workspace as any).workspaceFolders = original; };
}

type InspectResult = {
    globalValue?: string;
    workspaceValue?: string;
    workspaceFolderValue?: string;
};

function makeConfig(legacy: InspectResult, current: InspectResult) {
    const store: Record<string, Record<string, string | undefined>> = {
        portfolioName: { ...current },
        customer: { ...legacy },
    };

    const scopeKey = (scope: vscode.ConfigurationTarget) => {
        if (scope === vscode.ConfigurationTarget.Global) { return 'globalValue'; }
        if (scope === vscode.ConfigurationTarget.Workspace) { return 'workspaceValue'; }
        return 'workspaceFolderValue';
    };

    return {
        inspect: (key: string) => store[key],
        update: async (key: string, value: string | undefined, scope: vscode.ConfigurationTarget) => {
            store[key][scopeKey(scope)] = value;
        },
        get store() { return store; },
    };
}

suite('migrateCustomerToPortfolioName', () => {
    let originalGetConfiguration: any;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    });

    test('copies globalValue from customer to portfolioName and clears customer', async () => {
        const config = makeConfig({ globalValue: 'my-portfolio' }, {});
        (vscode.workspace as any).getConfiguration = () => config;

        await migrateCustomerToPortfolioName();

        assert.strictEqual(config.store.portfolioName.globalValue, 'my-portfolio');
        assert.strictEqual(config.store.customer.globalValue, undefined);
    });

    test('copies workspaceValue from customer to portfolioName and clears customer', async () => {
        const config = makeConfig({ workspaceValue: 'workspace-portfolio' }, {});
        (vscode.workspace as any).getConfiguration = () => config;

        await migrateCustomerToPortfolioName();

        assert.strictEqual(config.store.portfolioName.workspaceValue, 'workspace-portfolio');
        assert.strictEqual(config.store.customer.workspaceValue, undefined);
    });

    test('does not overwrite portfolioName when it is already set', async () => {
        const config = makeConfig({ globalValue: 'old-portfolio' }, { globalValue: 'new-portfolio' });
        (vscode.workspace as any).getConfiguration = () => config;

        await migrateCustomerToPortfolioName();

        assert.strictEqual(config.store.portfolioName.globalValue, 'new-portfolio');
        assert.strictEqual(config.store.customer.globalValue, 'old-portfolio');
    });

    test('does nothing when customer is not set', async () => {
        const config = makeConfig({}, {});
        (vscode.workspace as any).getConfiguration = () => config;

        await migrateCustomerToPortfolioName();

        assert.strictEqual(config.store.portfolioName.globalValue, undefined);
        assert.strictEqual(config.store.customer.globalValue, undefined);
    });

    test('migrates each scope independently', async () => {
        const config = makeConfig(
            { globalValue: 'global-portfolio', workspaceValue: 'workspace-portfolio' },
            { globalValue: 'existing-global' }
        );
        (vscode.workspace as any).getConfiguration = () => config;

        await migrateCustomerToPortfolioName();

        assert.strictEqual(config.store.portfolioName.globalValue, 'existing-global');
        assert.strictEqual(config.store.customer.globalValue, 'global-portfolio');
        assert.strictEqual(config.store.portfolioName.workspaceValue, 'workspace-portfolio');
        assert.strictEqual(config.store.customer.workspaceValue, undefined);
    });
});

function makeSecretsConfig(legacy: InspectResult) {
    const store: Record<string, InspectResult> = {
        apiKey: { ...legacy },
        jiraToken: {},
        azureDevOpsPersonalAccessToken: {},
    };
    const updateCalls: { key: string; scope: vscode.ConfigurationTarget }[] = [];

    const scopeKey = (scope: vscode.ConfigurationTarget) => {
        if (scope === vscode.ConfigurationTarget.Global) { return 'globalValue'; }
        if (scope === vscode.ConfigurationTarget.Workspace) { return 'workspaceValue'; }
        return 'workspaceFolderValue';
    };

    return {
        inspect: (key: string) => store[key],
        update: async (key: string, value: string | undefined, scope: vscode.ConfigurationTarget) => {
            updateCalls.push({ key, scope });
            store[key][scopeKey(scope)] = value;
        },
        get store() { return store; },
        get updateCalls() { return updateCalls; },
    };
}

function makeFakeSecretStorage() {
    const store: Record<string, string | undefined> = {};
    return {
        get: async (key: string) => store[key],
        store: async (key: string, value: string) => { store[key] = value; },
        delete: async (key: string) => { delete store[key]; },
        onDidChange: () => ({ dispose: () => { } }),
        get valueStore() { return store; },
    } as unknown as vscode.SecretStorage & { valueStore: Record<string, string | undefined> };
}

suite('migrateSecretsToSecretStorage', () => {
    let originalGetConfiguration: any;

    setup(() => {
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
    });

    teardown(() => {
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
    });

    test('moves a legacy plaintext apiKey setting into SecretStorage and clears the setting', async () => {
        const config = makeSecretsConfig({ globalValue: 'my-api-key' });
        (vscode.workspace as any).getConfiguration = () => config;
        const secrets = makeFakeSecretStorage();

        await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

        assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), 'my-api-key');
        assert.strictEqual(config.store.apiKey.globalValue, undefined);
    });

    test('does not attempt a WorkspaceFolder-scope update when no workspace-folder-scoped legacy value exists', async () => {
        const config = makeSecretsConfig({ globalValue: 'my-api-key' });
        (vscode.workspace as any).getConfiguration = () => config;
        const secrets = makeFakeSecretStorage();

        await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

        assert.ok(!config.updateCalls.some(call => call.scope === vscode.ConfigurationTarget.WorkspaceFolder));
        assert.strictEqual(config.store.apiKey.globalValue, undefined);
    });

    test('migrates the global and workspace legacy values into separate scoped secrets', async () => {
        const restoreWorkspace = mockOpenWorkspace();
        try {
            const config = makeSecretsConfig({ globalValue: 'global-key', workspaceValue: 'workspace-key' });
            (vscode.workspace as any).getConfiguration = () => config;
            const secrets = makeFakeSecretStorage();

            await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

            assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), 'global-key');
            assert.strictEqual(await secrets.get(buildScopedKey(SECRET_KEYS.apiKey, TEST_WORKSPACE_URI)), 'workspace-key');
        } finally {
            restoreWorkspace();
        }
    });

    test('prefers workspaceFolderValue over workspaceValue for the workspace-scoped secret', async () => {
        const restoreWorkspace = mockOpenWorkspace();
        try {
            const config = makeSecretsConfig({
                globalValue: 'global-key',
                workspaceValue: 'workspace-key',
                workspaceFolderValue: 'workspace-folder-key',
            });
            (vscode.workspace as any).getConfiguration = () => config;
            const secrets = makeFakeSecretStorage();

            await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

            assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), 'global-key');
            assert.strictEqual(await secrets.get(buildScopedKey(SECRET_KEYS.apiKey, TEST_WORKSPACE_URI)), 'workspace-folder-key');
        } finally {
            restoreWorkspace();
        }
    });

    test('falls back to global scope for a workspace-scoped legacy value when no workspace is open', async () => {
        const config = makeSecretsConfig({ workspaceValue: 'workspace-key' });
        (vscode.workspace as any).getConfiguration = () => config;
        const secrets = makeFakeSecretStorage();

        await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

        assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), 'workspace-key');
    });

    test('does nothing when no legacy secret setting is present', async () => {
        const config = makeSecretsConfig({});
        (vscode.workspace as any).getConfiguration = () => config;
        const secrets = makeFakeSecretStorage();

        await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

        assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), undefined);
    });

    test('does not overwrite a secret that has already been migrated', async () => {
        const config = makeSecretsConfig({ globalValue: 'old-plaintext-key' });
        (vscode.workspace as any).getConfiguration = () => config;
        const secrets = makeFakeSecretStorage();
        await secrets.store(SECRET_KEYS.apiKey, 'already-migrated-key');

        await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

        assert.strictEqual(await secrets.get(SECRET_KEYS.apiKey), 'already-migrated-key');
    });

    test('does not overwrite a workspace-scoped secret that has already been migrated', async () => {
        const restoreWorkspace = mockOpenWorkspace();
        try {
            const config = makeSecretsConfig({ workspaceValue: 'old-workspace-key' });
            (vscode.workspace as any).getConfiguration = () => config;
            const secrets = makeFakeSecretStorage();
            await secrets.store(buildScopedKey(SECRET_KEYS.apiKey, TEST_WORKSPACE_URI), 'already-migrated-workspace-key');

            await migrateSecretsToSecretStorage({ secrets } as unknown as vscode.ExtensionContext);

            assert.strictEqual(
                await secrets.get(buildScopedKey(SECRET_KEYS.apiKey, TEST_WORKSPACE_URI)),
                'already-migrated-workspace-key'
            );
        } finally {
            restoreWorkspace();
        }
    });
});
