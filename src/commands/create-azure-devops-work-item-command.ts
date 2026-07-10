import { env, Uri, window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { IssueFinding } from "./issue-finding";
import { readAzureDevOpsSettings } from "../utilities/get-azure-devops-config";
import { escapeHtml } from "../utilities/escape-html";
import { trackUsage } from "../utilities/usage-statistics";
import { buildBasicAuthHeader } from "../utilities/basic-auth";
import { formatLocation } from "../utilities/format-location";
import { buildAzureDevOpsWitUrl } from "../utilities/azure-devops-api";

const REPRO_STEPS_FIELD = 'Microsoft.VSTS.TCM.ReproSteps';

interface CreateAzureDevOpsWorkItemPayload {
    title: string;
    workItemType: string;
    findings: IssueFinding[];
    sigridUrl: string;
}

interface AzureDevOpsWorkItemTypeFieldsResponse {
    fields: { referenceName: string }[];
}

interface AzureDevOpsSettings {
    organizationUrl: string;
    personalAccessToken: string;
    projectName: string;
}

interface AzureDevOpsWorkItemResponse {
    id: number;
    _links?: { html?: { href?: string } };
}

export class CreateAzureDevOpsWorkItemCommand implements VsCodeCommand<CreateAzureDevOpsWorkItemPayload> {
    private readonly fieldCache = new Map<string, Set<string>>();

    async execute(data: VsCodeCommandData<CreateAzureDevOpsWorkItemPayload>) {
        const { title, workItemType, findings, sigridUrl } = data.payload;
        const config = workspace.getConfiguration(EXTENSION_ID);
        const settings = readAzureDevOpsSettings(config);

        if (!this.hasCompleteSettings(settings)) {
            window.showErrorMessage('Azure DevOps settings are incomplete. Please configure the organization URL, personal access token, and project name in the extension settings.');
            return;
        }

        const authHeader = buildBasicAuthHeader('', settings.personalAccessToken);
        const description = this.buildHtmlDescription(findings, sigridUrl);
        const body = await this.buildWorkItemBody(settings, workItemType, authHeader, title, description);

        const response = await this.createWorkItem(settings, workItemType, authHeader, body);
        if (!response) {
            return;
        }

        const result = await this.parseWorkItemResponse(response);
        if (!result) {
            return;
        }

        trackUsage(config.get<string>('customer', ''), 'createAzureDevOpsWorkItem');
        await this.notifyWorkItemCreated(result);
    }

    private hasCompleteSettings(settings: AzureDevOpsSettings): boolean {
        return Boolean(settings.organizationUrl && settings.personalAccessToken && settings.projectName);
    }

    private async buildWorkItemBody(
        settings: AzureDevOpsSettings, workItemType: string, authHeader: string, title: string, description: string
    ): Promise<string> {
        const { organizationUrl, projectName, personalAccessToken } = settings;
        const supportsReproSteps = await this.supportsField(organizationUrl, projectName, personalAccessToken, workItemType, authHeader, REPRO_STEPS_FIELD);

        const ops = [
            { op: 'add', path: '/fields/System.Title', value: title },
            { op: 'add', path: '/fields/System.Description', value: description },
        ];

        if (supportsReproSteps) {
            ops.push({ op: 'add', path: `/fields/${REPRO_STEPS_FIELD}`, value: description });
        }

        return JSON.stringify(ops);
    }

    private async createWorkItem(
        settings: AzureDevOpsSettings, workItemType: string, authHeader: string, body: string
    ): Promise<Response | undefined> {
        const url = buildAzureDevOpsWitUrl(settings.organizationUrl, settings.projectName, `workitems/$${encodeURIComponent(workItemType)}`);

        let response: Response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json-patch+json',
                    'Authorization': authHeader,
                },
                body,
            });
        } catch (error) {
            console.error('Failed to create Azure DevOps work item:', error);
            window.showErrorMessage(`Failed to create Azure DevOps work item: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Azure DevOps API error:', response.status, errorBody);
            window.showErrorMessage(`Failed to create Azure DevOps work item (${response.status}): ${errorBody.substring(0, 200)}`);
            return undefined;
        }

        return response;
    }

    private async parseWorkItemResponse(response: Response): Promise<AzureDevOpsWorkItemResponse | undefined> {
        try {
            return await response.json() as AzureDevOpsWorkItemResponse;
        } catch (error) {
            console.error('Failed to parse Azure DevOps work item response:', error);
            window.showErrorMessage(`Failed to parse the response from Azure DevOps: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }

    private async notifyWorkItemCreated(result: AzureDevOpsWorkItemResponse): Promise<void> {
        const href = result._links?.html?.href;
        const action = await window.showInformationMessage(
            `Work item created: #${result.id}`,
            ...(href ? ['Open in Browser'] : [])
        );

        if (action === 'Open in Browser' && href) {
            env.openExternal(Uri.parse(href));
        }
    }

    private async supportsField(
        organizationUrl: string, projectName: string, personalAccessToken: string,
        workItemType: string, authHeader: string, fieldReferenceName: string
    ): Promise<boolean> {
        const cacheKey = `${organizationUrl}|${projectName}|${personalAccessToken}|${workItemType}`;
        let fields = this.fieldCache.get(cacheKey);

        if (!fields) {
            fields = await this.fetchWorkItemTypeFields(organizationUrl, projectName, workItemType, authHeader);
            this.fieldCache.set(cacheKey, fields);
        }

        return fields.has(fieldReferenceName);
    }

    private async fetchWorkItemTypeFields(
        organizationUrl: string, projectName: string, workItemType: string, authHeader: string
    ): Promise<Set<string>> {
        const url = buildAzureDevOpsWitUrl(organizationUrl, projectName, `workitemtypes/${encodeURIComponent(workItemType)}`);

        try {
            const response = await fetch(url, { headers: { 'Authorization': authHeader } });
            if (!response.ok) {
                console.error('Azure DevOps API error fetching work item type fields:', response.status, await response.text());
                return new Set();
            }

            const result = await response.json() as AzureDevOpsWorkItemTypeFieldsResponse;
            return new Set(result.fields.map(field => field.referenceName));
        } catch (error) {
            console.error('Failed to fetch Azure DevOps work item type fields:', error);
            return new Set();
        }
    }

    private buildHtmlDescription(findings: IssueFinding[], sigridUrl: string): string {
        const items = findings.map(finding => {
            const locations = finding.fileLocations.map(loc => {
                return `<li>${escapeHtml(formatLocation(loc))}</li>`;
            }).join('');

            const locationsList = locations ? `<ul>${locations}</ul>` : '';

            return `<li>${finding.emoji} <strong>${escapeHtml(finding.title)}</strong>${locationsList}</li>`;
        }).join('');

        return `<h2>Code selected for refactoring</h2>`
            + `<p>The following Sigrid findings have been selected for improvement:</p>`
            + `<ul>${items}</ul>`
            + `<p>You can find more information in <a href="${escapeHtml(sigridUrl)}">Sigrid</a>.</p>`;
    }
}
