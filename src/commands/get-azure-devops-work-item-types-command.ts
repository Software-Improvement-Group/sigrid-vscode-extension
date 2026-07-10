import { workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { readAzureDevOpsSettings } from "../utilities/get-azure-devops-config";
import { buildBasicAuthHeader } from "../utilities/basic-auth";
import { buildAzureDevOpsWitUrl } from "../utilities/azure-devops-api";

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
    const url = buildAzureDevOpsWitUrl(organizationUrl, projectName, 'workitemtypecategories');

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
        const result = await this.resolveTypes();
        data.webview.postMessage({ command: 'azureDevOpsWorkItemTypesLoaded', data: result });
    }

    private async resolveTypes(): Promise<{ types: string[] } | { error: string }> {
        const config = workspace.getConfiguration(EXTENSION_ID);
        const { organizationUrl, personalAccessToken, projectName } = readAzureDevOpsSettings(config);

        if (!organizationUrl || !personalAccessToken || !projectName) {
            return { error: 'Azure DevOps settings are incomplete.' };
        }

        const cacheKey = `${organizationUrl}|${projectName}|${personalAccessToken}`;
        if (this.cachedKey === cacheKey && this.cachedTypes) {
            return { types: this.cachedTypes };
        }

        const authHeader = buildBasicAuthHeader('', personalAccessToken);
        const result = await this.fetchTypes(organizationUrl, projectName, authHeader);

        if ('types' in result) {
            this.cachedKey = cacheKey;
            this.cachedTypes = result.types;
        }

        return result;
    }

    private async fetchTypes(organizationUrl: string, projectName: string, authHeader: string): Promise<{ types: string[] } | { error: string }> {
        const url = buildAzureDevOpsWitUrl(organizationUrl, projectName, 'workitemtypes');

        let response: Response;
        let excludedTypeNames: Set<string>;
        try {
            [response, excludedTypeNames] = await Promise.all([
                fetch(url, { headers: { 'Authorization': authHeader } }),
                fetchExcludedTypeNames(organizationUrl, projectName, authHeader),
            ]);
        } catch (error) {
            console.error('Failed to fetch Azure DevOps work item types:', error);
            return { error: error instanceof Error ? error.message : String(error) };
        }

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Azure DevOps API error:', response.status, errorBody);
            return { error: `Failed to fetch work item types (${response.status})` };
        }

        return this.parseTypes(response, excludedTypeNames);
    }

    private async parseTypes(response: Response, excludedTypeNames: Set<string>): Promise<{ types: string[] } | { error: string }> {
        try {
            const result = await response.json() as { value: AzureDevOpsWorkItemType[] };
            const types = result.value
                .filter(type => !type.isDisabled && !excludedTypeNames.has(type.name.toLowerCase()))
                .map(type => type.name);
            return { types };
        } catch (error) {
            console.error('Failed to parse Azure DevOps work item types response:', error);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
}
