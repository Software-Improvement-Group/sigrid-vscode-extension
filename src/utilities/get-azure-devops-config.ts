import { WorkspaceConfiguration } from "vscode";
import { normalizeBaseUrl } from "./normalize-base-url";

export function readAzureDevOpsSettings(config: WorkspaceConfiguration) {
    return {
        organizationUrl: normalizeBaseUrl(config.get<string>('azureDevOpsOrganizationUrl', '')),
        personalAccessToken: config.get<string>('azureDevOpsPersonalAccessToken', '').trim(),
        projectName: config.get<string>('azureDevOpsProjectName', '').trim(),
    };
}
