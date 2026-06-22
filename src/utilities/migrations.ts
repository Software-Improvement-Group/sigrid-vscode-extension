import * as vscode from 'vscode';
import { EXTENSION_ID } from '../extension.config';

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
