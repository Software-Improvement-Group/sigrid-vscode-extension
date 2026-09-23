import * as vscode from "vscode";
import { SECRET_KEYS } from "./secrets";
import { getWorkspaceId, setSecret, SecretScope } from "./scoped-secrets";

interface SecretCommandSpec {
    commandId: string;
    secretKey: string;
    label: string;
}

const SECRET_COMMAND_SPECS: SecretCommandSpec[] = [
    { commandId: 'sigrid-vscode.setApiKey', secretKey: SECRET_KEYS.apiKey, label: 'Sigrid API Key' },
    { commandId: 'sigrid-vscode.setJiraToken', secretKey: SECRET_KEYS.jiraToken, label: 'JIRA Personal Access Token' },
    { commandId: 'sigrid-vscode.setAzureDevOpsToken', secretKey: SECRET_KEYS.azureDevOpsPersonalAccessToken, label: 'Azure DevOps Personal Access Token' },
];

export function registerSecretCommands(context: vscode.ExtensionContext) {
    for (const spec of SECRET_COMMAND_SPECS) {
        registerSetSecretCommand(context, spec);
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
            const scopeDescription = scope === 'workspace' ? 'for this workspace' : 'globally';
            vscode.window.showInformationMessage(`${label} saved securely ${scopeDescription}.`);
        }
    });

    context.subscriptions.push(disposable);
}

async function promptForScope(): Promise<SecretScope | undefined> {
    if (!getWorkspaceId()) {
        return 'global';
    }

    const selection = await vscode.window.showQuickPick(
        [
            { label: 'This workspace only', scope: 'workspace' as const },
            { label: 'Global — all workspaces', scope: 'global' as const },
        ],
        { placeHolder: 'Where should this value be saved?', ignoreFocusOut: true }
    );

    return selection?.scope;
}
