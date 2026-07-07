import { env, Uri, window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { IssueFinding } from "./issue-finding";
import { normalizeBaseUrl } from "../utilities/normalize-base-url";
import { escapeHtml } from "../utilities/escape-html";
import { trackUsage } from "../utilities/usage-statistics";

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

        const organizationUrl = normalizeBaseUrl(config.get<string>('azureDevOpsOrganizationUrl', ''));
        const personalAccessToken = config.get<string>('azureDevOpsPersonalAccessToken', '').trim();
        const projectName = config.get<string>('azureDevOpsProjectName', '').trim();

        if (!organizationUrl || !personalAccessToken || !projectName) {
            window.showErrorMessage('Azure DevOps settings are incomplete. Please configure the organization URL, personal access token, and project name in the extension settings.');
            return;
        }

        const authHeader = 'Basic ' + Buffer.from(`:${personalAccessToken}`).toString('base64');
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

        const result = await response.json() as { id: number; _links: { html: { href: string } } };

        trackUsage(config.get<string>('customer', ''), 'createAzureDevOpsWorkItem');

        const action = await window.showInformationMessage(
            `Work item created: #${result.id}`,
            'Open in Browser'
        );

        if (action === 'Open in Browser') {
            env.openExternal(Uri.parse(result._links.html.href));
        }
    }

    private buildHtmlDescription(findings: IssueFinding[], sigridUrl: string): string {
        const items = findings.map(finding => {
            const locations = finding.fileLocations.map(loc => {
                const lineInfo = loc.startLine ? `:${loc.startLine}` : '';
                return `<li>${escapeHtml(`${loc.filePath}${lineInfo}`)}</li>`;
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
