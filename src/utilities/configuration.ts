import { SecretStorage, workspace } from "vscode";
import { EXTENSION_ID } from "../extension.config";
import { SECRET_KEYS } from "./secrets";

export function getSigridConfiguration() {
    const config = workspace.getConfiguration(EXTENSION_ID);
    return {
        customer: config.get<string>('portfolioName', '') || config.get<string>('customer', ''),
        system: config.get<string>('system', ''),
        subsystem: config.get<string>('subsystem', ''),
        sigridUrl: config.get<string>('sigridUrl', 'https://sigrid-says.com'),
        jiraBaseUrl: config.get<string>('jiraBaseUrl', ''),
        jiraUser: config.get<string>('jiraUser', ''),
        jiraProjectKey: config.get<string>('jiraSpaceKey', ''),
        azureDevOpsOrganizationUrl: config.get<string>('azureDevOpsOrganizationUrl', ''),
        azureDevOpsProjectName: config.get<string>('azureDevOpsProjectName', ''),
    };
}

export async function getSigridWebviewConfiguration(secrets: SecretStorage) {
    const [apiKey, jiraToken, azureDevOpsToken] = await Promise.all([
        secrets.get(SECRET_KEYS.apiKey),
        secrets.get(SECRET_KEYS.jiraToken),
        secrets.get(SECRET_KEYS.azureDevOpsPersonalAccessToken),
    ]);

    return {
        ...getSigridConfiguration(),
        apiKey: apiKey ?? '',
        hasJiraToken: !!jiraToken,
        hasAzureDevOpsToken: !!azureDevOpsToken,
    };
}
