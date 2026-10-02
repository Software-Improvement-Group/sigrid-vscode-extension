import * as vscode from "vscode";
import { SECRET_KEYS } from "./secrets";
import { deleteSecret, getWorkspaceId, setSecret, SecretScope } from "./scoped-secrets";

interface SecretCommandSpec {
    commandId: string;
    clearCommandId: string;
    secretKey: string;
    label: string;
}

const SECRET_COMMAND_SPECS: SecretCommandSpec[] = [
    { commandId: 'sigrid-vscode.setApiKey', clearCommandId: 'sigrid-vscode.clearApiKey', secretKey: SECRET_KEYS.apiKey, label: 'Sigrid API Key' },
    { commandId: 'sigrid-vscode.setJiraToken', clearCommandId: 'sigrid-vscode.clearJiraToken', secretKey: SECRET_KEYS.jiraToken, label: 'JIRA Personal Access Token' },
    { commandId: 'sigrid-vscode.setAzureDevOpsToken', clearCommandId: 'sigrid-vscode.clearAzureDevOpsToken', secretKey: SECRET_KEYS.azureDevOpsPersonalAccessToken, label: 'Azure DevOps Personal Access Token' },
];

export function registerSecretCommands(context: vscode.ExtensionContext) {
    for (const spec of SECRET_COMMAND_SPECS) {
        registerSetSecretCommand(context, spec);
        registerClearSecretCommand(context, spec);
    }
}

function registerSetSecretCommand(context: vscode.ExtensionContext, { commandId, secretKey, label }: SecretCommandSpec) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
        const scope = await promptForScope();
        if (!scope) {
            return;
        }

        const value = await vscode.window.showInputBox({ prompt: `Enter your ${label}`, password: true, ignoreFocusOut: true });
        if (value) {
            await setSecret({ secrets: context.secrets, baseKey: secretKey, value, scope });
            vscode.window.showInformationMessage(`${label} saved securely ${describeScope(scope)}.`);
        }
    });

    context.subscriptions.push(disposable);
}

function registerClearSecretCommand(context: vscode.ExtensionContext, { clearCommandId, secretKey, label }: SecretCommandSpec) {
    const disposable = vscode.commands.registerCommand(clearCommandId, async () => {
        const scope = await promptForScope('Which saved value should be cleared?');
        if (!scope) {
            return;
        }

        await deleteSecret({ secrets: context.secrets, baseKey: secretKey, scope });
        vscode.window.showInformationMessage(`${label} cleared ${describeScope(scope)}.`);
    });

    context.subscriptions.push(disposable);
}

function describeScope(scope: SecretScope): string {
    return scope === 'workspace' ? 'for this workspace' : 'globally';
}

async function promptForScope(placeHolder = 'Where should this value be saved?'): Promise<SecretScope | undefined> {
    if (!getWorkspaceId()) {
        return 'global';
    }

    const selection = await vscode.window.showQuickPick(
        [
            { label: 'This workspace only', scope: 'workspace' as const },
            { label: 'Global — all workspaces', scope: 'global' as const },
        ],
        { placeHolder, ignoreFocusOut: true }
    );

    return selection?.scope;
}
