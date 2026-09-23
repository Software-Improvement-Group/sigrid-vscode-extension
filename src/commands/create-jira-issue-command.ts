import { window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { IssueFinding } from "./issue-finding";
import { normalizeBaseUrl } from "../utilities/normalize-base-url";
import { trackUsage } from "../utilities/usage-statistics";
import { buildBasicAuthHeader } from "../utilities/basic-auth";
import { formatLocation } from "../utilities/format-location";
import { SECRET_KEYS } from "../utilities/secrets";
import { getSecret } from "../utilities/scoped-secrets";
import { openExternalUrl, parseExternalUrl } from "../utilities/url-validation";

interface CreateJiraIssuePayload {
    title: string;
    findings: IssueFinding[];
    sigridUrl: string;
}

export class CreateJiraIssueCommand implements VsCodeCommand<CreateJiraIssuePayload> {
    async execute(data: VsCodeCommandData<CreateJiraIssuePayload>) {
        const { title, findings, sigridUrl } = data.payload;
        const config = workspace.getConfiguration(EXTENSION_ID);

        const jiraBaseUrl = normalizeBaseUrl(config.get<string>('jiraBaseUrl', ''));
        const jiraUser = config.get<string>('jiraUser', '').trim();
        const jiraToken = (await getSecret(data.secrets, SECRET_KEYS.jiraToken) ?? '').trim();
        const jiraProjectKey = config.get<string>('jiraSpaceKey', '').trim();

        if (!jiraBaseUrl || !jiraUser || !jiraToken || !jiraProjectKey) {
            window.showErrorMessage('JIRA settings are incomplete. Please configure JIRA base URL, user, token, and space key in the extension settings.');
            return;
        }

        if (!this.validateJiraBaseUrl(jiraBaseUrl)) {
            return;
        }

        console.log(`Creating JIRA issue in project "${jiraProjectKey}" at ${jiraBaseUrl}`);

        const descriptionText = this.buildPlainTextDescription(findings, sigridUrl);
        const authHeader = buildBasicAuthHeader(jiraUser, jiraToken);

        // Try API v3 with ADF first, fall back to API v2 with plain text
        const adfDescription = this.buildAdfDescription(findings, sigridUrl);
        let response = await this.callJiraApi(
            `${jiraBaseUrl}/rest/api/3/issue`, authHeader, jiraProjectKey, title, adfDescription
        );

        if (response && !response.ok && response.status === 400) {
            console.log('JIRA API v3 failed, falling back to v2 with plain text description');
            response = await this.callJiraApi(
                `${jiraBaseUrl}/rest/api/2/issue`, authHeader, jiraProjectKey, title, descriptionText
            );
        }

        if (!response) {
            return;
        }

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('JIRA API error:', response.status, errorBody);
            window.showErrorMessage(this.buildErrorMessage(response.status, errorBody));
            return;
        }

        const result = await response.json() as { key: string };
        const issueKey = result.key;

        trackUsage(config.get<string>('customer', ''), 'createJiraIssue');

        const action = await window.showInformationMessage(
            `JIRA issue created: ${issueKey}`,
            'Open in Browser'
        );

        if (action === 'Open in Browser') {
            await openExternalUrl(`${jiraBaseUrl}/browse/${issueKey}`);
        }
    }

    private validateJiraBaseUrl(jiraBaseUrl: string): boolean {
        let uri;
        try {
            uri = parseExternalUrl(jiraBaseUrl);
        } catch (error) {
            console.error('Invalid JIRA base URL:', error);
            window.showErrorMessage('Invalid JIRA base URL configured. Please check the jiraBaseUrl setting.');
            return false;
        }

        if (uri.scheme === 'http') {
            void window.showWarningMessage(
                'The configured JIRA base URL uses an insecure http:// connection. Your JIRA credentials will be sent unencrypted.'
            );
        }

        return true;
    }

    private buildErrorMessage(status: number, errorBody: string): string {
        const detail = this.extractJiraErrorDetail(errorBody);
        if (detail) {
            return `Failed to create JIRA issue (${status}): ${detail.substring(0, 200)}`;
        }
        return `Failed to create JIRA issue (${status}). See the console for details.`;
    }

    private extractJiraErrorDetail(errorBody: string): string | null {
        let parsed: { errorMessages?: string[]; errors?: Record<string, string> };
        try {
            parsed = JSON.parse(errorBody);
        } catch {
            return null;
        }

        const messages = this.collectJiraErrorMessages(parsed);
        return messages.length > 0 ? messages.join('; ') : null;
    }

    private collectJiraErrorMessages(parsed: { errorMessages?: string[]; errors?: Record<string, string> }): string[] {
        const candidates = (parsed.errorMessages ?? []).concat(Object.values(parsed.errors ?? {}));
        return candidates.filter(message => typeof message === 'string' && message.length > 0);
    }

    private async callJiraApi(
        url: string, authHeader: string, projectKey: string, summary: string, description: object | string
    ): Promise<Response | null> {
        const body = JSON.stringify({
            fields: {
                project: { key: projectKey },
                summary,
                issuetype: { name: 'Task' },
                description,
            }
        });

        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'X-Force-Accept-Language': 'true',
                    'Accept-Language': 'en-US',
                },
                body,
            });
        } catch (error) {
            console.error('Failed to create JIRA issue:', error);
            window.showErrorMessage(`Failed to create JIRA issue: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    private buildAdfDescription(findings: IssueFinding[], sigridUrl: string): object {
        const content: object[] = [];

        content.push({
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Code selected for refactoring' }]
        });

        content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: 'The following Sigrid findings have been selected for improvement:' }]
        });

        const listItems: object[] = [];
        for (const finding of findings) {
            const findingContent: object[] = [
                { type: 'text', text: `${finding.emoji} ` },
                { type: 'text', text: finding.title, marks: [{ type: 'strong' }] },
            ];

            const subListItems: object[] = [];
            for (const loc of finding.fileLocations) {
                subListItems.push({
                    type: 'listItem',
                    content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: formatLocation(loc) }]
                    }]
                });
            }

            const itemContent: object[] = [
                { type: 'paragraph', content: findingContent }
            ];

            if (subListItems.length > 0) {
                itemContent.push({
                    type: 'bulletList',
                    content: subListItems
                });
            }

            listItems.push({
                type: 'listItem',
                content: itemContent
            });
        }

        content.push({
            type: 'bulletList',
            content: listItems
        });

        content.push({
            type: 'paragraph',
            content: [
                { type: 'text', text: 'You can find more information in ' },
                {
                    type: 'text',
                    text: 'Sigrid',
                    marks: [{ type: 'link', attrs: { href: sigridUrl } }]
                },
                { type: 'text', text: '.' },
            ]
        });

        return {
            type: 'doc',
            version: 1,
            content,
        };
    }

    private buildPlainTextDescription(findings: IssueFinding[], sigridUrl: string): string {
        const lines: string[] = [
            'h2. Code selected for refactoring',
            '',
            'The following Sigrid findings have been selected for improvement:',
            '',
        ];

        for (const finding of findings) {
            lines.push(`* ${finding.emoji} *${finding.title}*`);
            for (const loc of finding.fileLocations) {
                lines.push(`** ${formatLocation(loc)}`);
            }
        }

        lines.push('');
        lines.push(`You can find more information in [Sigrid|${sigridUrl}].`);

        return lines.join('\n');
    }
}
