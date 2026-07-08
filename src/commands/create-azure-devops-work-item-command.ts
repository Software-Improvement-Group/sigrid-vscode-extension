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

interface CreateAzureDevOpsWorkItemPayload {
    title: string;
    workItemType: string;
    findings: IssueFinding[];
    sigridUrl: string;
}

export class CreateAzureDevOpsWorkItemCommand implements VsCodeCommand<CreateAzureDevOpsWorkItemPayload> {
    async execute(data: VsCodeCommandData<CreateAzureDevOpsWorkItemPayload>) {
        const { title, workItemType, findings, sigridUrl } = data.payload;
        const config = workspace.getConfiguration(EXTENSION_ID);
        const { organizationUrl, personalAccessToken, projectName } = readAzureDevOpsSettings(config);

        if (!organizationUrl || !personalAccessToken || !projectName) {
            window.showErrorMessage('Azure DevOps settings are incomplete. Please configure the organization URL, personal access token, and project name in the extension settings.');
            return;
        }

        const authHeader = buildBasicAuthHeader('', personalAccessToken);
        const description = this.buildHtmlDescription(findings, sigridUrl);
        const url = `${organizationUrl}/${encodeURIComponent(projectName)}/_apis/wit/workitems/$${encodeURIComponent(workItemType)}?api-version=7.1`;

        const body = JSON.stringify([
            { op: 'add', path: '/fields/System.Title', value: title },
            { op: 'add', path: '/fields/System.Description', value: description },
        ]);

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
            return;
        }

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Azure DevOps API error:', response.status, errorBody);
            window.showErrorMessage(`Failed to create Azure DevOps work item (${response.status}): ${errorBody.substring(0, 200)}`);
            return;
        }

        let result: { id: number; _links?: { html?: { href?: string } } };
        try {
            result = await response.json() as { id: number; _links?: { html?: { href?: string } } };
        } catch (error) {
            console.error('Failed to parse Azure DevOps work item response:', error);
            window.showErrorMessage(`Failed to parse the response from Azure DevOps: ${error instanceof Error ? error.message : String(error)}`);
            return;
        }

        trackUsage(config.get<string>('customer', ''), 'createAzureDevOpsWorkItem');

        const href = result._links?.html?.href;
        const action = await window.showInformationMessage(
            `Work item created: #${result.id}`,
            ...(href ? ['Open in Browser'] : [])
        );

        if (action === 'Open in Browser' && href) {
            env.openExternal(Uri.parse(href));
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
