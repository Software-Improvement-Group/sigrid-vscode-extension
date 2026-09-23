import { SecretStorage, WorkspaceConfiguration } from "vscode";
import { normalizeBaseUrl } from "./normalize-base-url";
import { SECRET_KEYS } from "./secrets";

export async function readAzureDevOpsSettings(config: WorkspaceConfiguration, secrets: SecretStorage) {
    const personalAccessToken = await secrets.get(SECRET_KEYS.azureDevOpsPersonalAccessToken) ?? '';
    return {
        organizationUrl: normalizeBaseUrl(config.get<string>('azureDevOpsOrganizationUrl', '')),
        personalAccessToken: personalAccessToken.trim(),
        projectName: config.get<string>('azureDevOpsProjectName', '').trim(),
    };
}
