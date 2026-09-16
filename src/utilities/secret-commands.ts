import * as vscode from "vscode";
import { SECRET_KEYS } from "./secrets";

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
        const value = await vscode.window.showInputBox({ prompt: `Enter your ${label}`, password: true, ignoreFocusOut: true });
        if (value) {
            await context.secrets.store(secretKey, value);
            vscode.window.showInformationMessage(`${label} saved securely.`);
        }
    });

    context.subscriptions.push(disposable);
}
