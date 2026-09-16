import * as vscode from 'vscode';
import { EXTENSION_ID } from '../extension.config';
import { SECRET_KEYS } from './secrets';

const LEGACY_SECRET_SETTING_KEYS: Record<keyof typeof SECRET_KEYS, string> = {
    apiKey: 'apiKey',
    jiraToken: 'jiraToken',
    azureDevOpsPersonalAccessToken: 'azureDevOpsPersonalAccessToken',
};

export async function migrateSecretsToSecretStorage(context: vscode.ExtensionContext) {
    for (const key of Object.keys(LEGACY_SECRET_SETTING_KEYS) as (keyof typeof SECRET_KEYS)[]) {
        await migrateSecretSetting(context, key);
    }
}

async function migrateSecretSetting(context: vscode.ExtensionContext, key: keyof typeof SECRET_KEYS) {
    const settingKey = LEGACY_SECRET_SETTING_KEYS[key];
    const config = vscode.workspace.getConfiguration(EXTENSION_ID);
    const legacy = config.inspect<string>(settingKey);
    const value = legacy?.workspaceFolderValue || legacy?.workspaceValue || legacy?.globalValue;
    if (!value || await context.secrets.get(SECRET_KEYS[key])) {
        return;
    }

    await context.secrets.store(SECRET_KEYS[key], value);
    await clearLegacySecretSetting(config, settingKey, legacy);
}

async function clearLegacySecretSetting(
    config: vscode.WorkspaceConfiguration,
    settingKey: string,
    legacy: ReturnType<vscode.WorkspaceConfiguration['inspect']>
) {
    for (const target of [
        { value: legacy?.globalValue, scope: vscode.ConfigurationTarget.Global },
        { value: legacy?.workspaceValue, scope: vscode.ConfigurationTarget.Workspace },
        { value: legacy?.workspaceFolderValue, scope: vscode.ConfigurationTarget.WorkspaceFolder },
    ]) {
        if (target.value) {
            await config.update(settingKey, undefined, target.scope);
        }
    }
}

export async function migrateCustomerToPortfolioName() {
    const config = vscode.workspace.getConfiguration(EXTENSION_ID);
    const legacy = config.inspect<string>('customer');
    const current = config.inspect<string>('portfolioName');

    for (const target of [
        { value: legacy?.globalValue, scope: vscode.ConfigurationTarget.Global },
        { value: legacy?.workspaceValue, scope: vscode.ConfigurationTarget.Workspace },
        { value: legacy?.workspaceFolderValue, scope: vscode.ConfigurationTarget.WorkspaceFolder },
    ]) {
        if (target.value && !getInspectValue(current, target.scope)) {
            await config.update('portfolioName', target.value, target.scope);
            await config.update('customer', undefined, target.scope);
        }
    }
}

function getInspectValue(
    inspect: ReturnType<vscode.WorkspaceConfiguration['inspect']>,
    scope: vscode.ConfigurationTarget
): string | undefined {
    if (!inspect) { return undefined; }
    if (scope === vscode.ConfigurationTarget.Global) { return inspect.globalValue as string | undefined; }
    if (scope === vscode.ConfigurationTarget.Workspace) { return inspect.workspaceValue as string | undefined; }
    return inspect.workspaceFolderValue as string | undefined;
}
