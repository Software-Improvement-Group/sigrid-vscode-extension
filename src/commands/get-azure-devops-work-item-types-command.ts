import { workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { normalizeBaseUrl } from "../utilities/normalize-base-url";

const HIDDEN_CATEGORY = 'microsoft.hiddencategory';
const EXCLUDED_DEFAULT_TYPE_CATEGORIES = new Set(['microsoft.testcasecategory', 'microsoft.epiccategory']);

interface AzureDevOpsWorkItemType {
    name: string;
    isDisabled?: boolean;
}

interface AzureDevOpsWorkItemTypeCategory {
    referenceName: string;
    defaultWorkItemType: { name: string };
    workItemTypes: { name: string }[];
}

async function fetchExcludedTypeNames(organizationUrl: string, projectName: string, authHeader: string): Promise<Set<string>> {
    const url = `${organizationUrl}/${encodeURIComponent(projectName)}/_apis/wit/workitemtypecategories?api-version=7.1`;

    try {
        const response = await fetch(url, { headers: { 'Authorization': authHeader } });
        if (!response.ok) {
            console.error('Azure DevOps API error fetching work item type categories:', response.status, await response.text());
            return new Set();
        }

        const result = await response.json() as { value: AzureDevOpsWorkItemTypeCategory[] };
        const excluded = new Set<string>();
        for (const category of result.value) {
            const referenceName = category.referenceName.toLowerCase();
            if (referenceName === HIDDEN_CATEGORY) {
                category.workItemTypes.forEach(type => excluded.add(type.name.toLowerCase()));
            } else if (EXCLUDED_DEFAULT_TYPE_CATEGORIES.has(referenceName)) {
                excluded.add(category.defaultWorkItemType.name.toLowerCase());
            }
        }
        return excluded;
    } catch (error) {
        console.error('Failed to fetch Azure DevOps work item type categories:', error);
        return new Set();
    }
}

export class GetAzureDevOpsWorkItemTypesCommand implements VsCodeCommand<undefined> {
    private cachedKey: string | null = null;
    private cachedTypes: string[] | null = null;

    async execute(data: VsCodeCommandData<undefined>) {
        const config = workspace.getConfiguration(EXTENSION_ID);

        const organizationUrl = normalizeBaseUrl(config.get<string>('azureDevOpsOrganizationUrl', ''));
        const personalAccessToken = config.get<string>('azureDevOpsPersonalAccessToken', '').trim();
        const projectName = config.get<string>('azureDevOpsProjectName', '').trim();

        if (!organizationUrl || !personalAccessToken || !projectName) {
            data.webview.postMessage({
                command: 'azureDevOpsWorkItemTypesLoaded',
                data: { error: 'Azure DevOps settings are incomplete.' },
            });
            return;
        }

        const cacheKey = `${organizationUrl}|${projectName}|${personalAccessToken}`;
        if (this.cachedKey === cacheKey && this.cachedTypes) {
            data.webview.postMessage({ command: 'azureDevOpsWorkItemTypesLoaded', data: { types: this.cachedTypes } });
            return;
        }

        const authHeader = 'Basic ' + Buffer.from(`:${personalAccessToken}`).toString('base64');
        const url = `${organizationUrl}/${encodeURIComponent(projectName)}/_apis/wit/workitemtypes?api-version=7.1`;

        let response: Response;
        try {
            response = await fetch(url, {
                headers: { 'Authorization': authHeader },
            });
        } catch (error) {
            console.error('Failed to fetch Azure DevOps work item types:', error);
            data.webview.postMessage({
                command: 'azureDevOpsWorkItemTypesLoaded',
                data: { error: error instanceof Error ? error.message : String(error) },
            });
            return;
        }

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Azure DevOps API error:', response.status, errorBody);
            data.webview.postMessage({
                command: 'azureDevOpsWorkItemTypesLoaded',
                data: { error: `Failed to fetch work item types (${response.status})` },
            });
            return;
        }

        const excludedTypeNames = await fetchExcludedTypeNames(organizationUrl, projectName, authHeader);

        const result = await response.json() as { value: AzureDevOpsWorkItemType[] };
        const types = result.value
            .filter(type => !type.isDisabled && !excludedTypeNames.has(type.name.toLowerCase()))
            .map(type => type.name);

        this.cachedKey = cacheKey;
        this.cachedTypes = types;

        data.webview.postMessage({ command: 'azureDevOpsWorkItemTypesLoaded', data: { types } });
    }
}
