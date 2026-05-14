import { env, Uri, window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";

const STATISTICS_URL = 'https://sigrid-says.com/usage/matomo.php?idsite=5&rec=1&ca=1&e_c=vscode&e_a=';

interface JiraFinding {
    emoji: string;
    title: string;
    fileLocations: { filePath: string; startLine?: number }[];
}

interface CreateJiraIssuePayload {
    title: string;
    findings: JiraFinding[];
    sigridUrl: string;
}

export class CreateJiraIssueCommand implements VsCodeCommand<CreateJiraIssuePayload> {
    async execute(data: VsCodeCommandData<CreateJiraIssuePayload>) {
        const { title, findings, sigridUrl } = data.payload;
        const config = workspace.getConfiguration(EXTENSION_ID);

        const jiraBaseUrl = config.get<string>('jiraBaseUrl', '').trim().replace(/\/+$/, '');
        const jiraUser = config.get<string>('jiraUser', '').trim();
        const jiraToken = config.get<string>('jiraToken', '').trim();
        const jiraProjectKey = config.get<string>('jiraSpaceKey', '').trim();

        if (!jiraBaseUrl || !jiraUser || !jiraToken || !jiraProjectKey) {
            window.showErrorMessage('JIRA settings are incomplete. Please configure JIRA base URL, user, token, and space key in the extension settings.');
            return;
        }

        console.log(`Creating JIRA issue in project "${jiraProjectKey}" at ${jiraBaseUrl}`);

        const descriptionText = this.buildPlainTextDescription(findings, sigridUrl);
        const authHeader = 'Basic ' + Buffer.from(`${jiraUser}:${jiraToken}`).toString('base64');

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
            window.showErrorMessage(`Failed to create JIRA issue (${response.status}): ${errorBody.substring(0, 200)}`);
            return;
        }

        const result = await response.json() as { key: string };
        const issueKey = result.key;

        this.trackUsage(config.get<string>('customer', ''));

        const action = await window.showInformationMessage(
            `JIRA issue created: ${issueKey}`,
            'Open in Browser'
        );

        if (action === 'Open in Browser') {
            env.openExternal(Uri.parse(`${jiraBaseUrl}/browse/${issueKey}`));
        }
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
                },
                body,
            });
        } catch (error) {
            console.error('Failed to create JIRA issue:', error);
            window.showErrorMessage(`Failed to create JIRA issue: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    private buildAdfDescription(findings: JiraFinding[], sigridUrl: string): object {
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
                const lineInfo = loc.startLine ? `:${loc.startLine}` : '';
                subListItems.push({
                    type: 'listItem',
                    content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: `${loc.filePath}${lineInfo}` }]
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

    private buildPlainTextDescription(findings: JiraFinding[], sigridUrl: string): string {
        const lines: string[] = [
            'h2. Code selected for refactoring',
            '',
            'The following Sigrid findings have been selected for improvement:',
            '',
        ];

        for (const finding of findings) {
            lines.push(`* ${finding.emoji} *${finding.title}*`);
            for (const loc of finding.fileLocations) {
                const lineInfo = loc.startLine ? `:${loc.startLine}` : '';
                lines.push(`** ${loc.filePath}${lineInfo}`);
            }
        }

        lines.push('');
        lines.push(`You can find more information in [Sigrid|${sigridUrl}].`);

        return lines.join('\n');
    }

    private trackUsage(customer: string) {
        if (!customer) {
            return;
        }
        fetch(STATISTICS_URL + encodeURIComponent(customer) + '&e_n=createJiraIssue', { method: 'GET' })
            .catch(err => console.error('Failed to send usage statistics:', err));
    }
}
