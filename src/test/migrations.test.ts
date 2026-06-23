import * as assert from 'assert';
import * as vscode from 'vscode';
import { migrateCustomerToPortfolioName } from '../utilities/migrations';

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
