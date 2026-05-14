import * as assert from 'assert';
import * as vscode from 'vscode';
import { CreateJiraIssueCommand } from '../commands/create-jira-issue-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

suite('CreateJiraIssueCommand', () => {
    let originalShowErrorMessage: any;
    let originalShowInformationMessage: any;
    let originalGetConfiguration: any;
    let originalOpenExternal: any;
    let originalFetch: any;

    setup(() => {
        originalShowErrorMessage = (vscode.window as any).showErrorMessage;
        originalShowInformationMessage = (vscode.window as any).showInformationMessage;
        originalGetConfiguration = (vscode.workspace as any).getConfiguration;
        originalOpenExternal = (vscode.env as any).openExternal;
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        (vscode.window as any).showInformationMessage = originalShowInformationMessage;
        (vscode.workspace as any).getConfiguration = originalGetConfiguration;
        (vscode.env as any).openExternal = originalOpenExternal;
        globalThis.fetch = originalFetch;
    });

    test('shows an error when JIRA settings are incomplete', async () => {
        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        (vscode.workspace as any).getConfiguration = () => ({
            get: (_key: string, defaultValue: any) => defaultValue,
        });

        let fetchCalled = false;
        globalThis.fetch = async () => {
            fetchCalled = true;
            return {} as any;
        };

        const command = new CreateJiraIssueCommand();
        await command.execute(new VsCodeCommandData({} as any, {} as any, {
            title: 'Test',
            findings: [],
            sigridUrl: 'https://sigrid.example.com',
        }));

        assert.strictEqual(fetchCalled, false);
        assert.strictEqual(errorMessage, 'JIRA settings are incomplete. Please configure JIRA base URL, user, token, and space key in the extension settings.');
    });

    test('creates an issue with the JIRA API v3 schema and opens the created issue in browser', async () => {
        const jiraConfig = {
            jiraBaseUrl: 'https://jira.example.com/',
            jiraUser: 'user@example.com',
            jiraToken: 'token',
            jiraSpaceKey: 'APP',
            customer: '',
        } as const;

        (vscode.workspace as any).getConfiguration = () => ({
            get: (key: string, defaultValue: any) => (jiraConfig as any)[key] ?? defaultValue,
        });

        let requestedUrl = '';
        let requestedBody = '';
        (vscode.window as any).showInformationMessage = (_message: string, option: string) => Promise.resolve(option as any);
        (vscode.window as any).showErrorMessage = (_message: string) => Promise.resolve(undefined);

        let openedUri = '';
        (vscode.env as any).openExternal = async (uri: vscode.Uri) => {
            openedUri = uri.toString();
            return true;
        };

        globalThis.fetch = async (input: any, init: any) => {
            requestedUrl = input.toString();
            requestedBody = init.body;
            return {
                ok: true,
                status: 201,
                json: async () => ({ key: 'APP-123' }),
                text: async () => '',
            } as any;
        };

        const command = new CreateJiraIssueCommand();
        await command.execute(new VsCodeCommandData({} as any, {} as any, {
            title: 'Refactor component',
            findings: [
                {
                    emoji: '⚠️',
                    title: 'Duplicate code',
                    fileLocations: [{ filePath: 'src/foo.ts', startLine: 24 }],
                },
            ],
            sigridUrl: 'https://sigrid.example.com',
        }));

        assert.strictEqual(requestedUrl, 'https://jira.example.com/rest/api/3/issue');

        const body = JSON.parse(requestedBody);
        assert.strictEqual(body.fields.project.key, 'APP');
        assert.strictEqual(body.fields.summary, 'Refactor component');
        assert.strictEqual(body.fields.description.type, 'doc');
        assert.strictEqual(openedUri, 'https://jira.example.com/browse/APP-123');
    });

    test('falls back to JIRA API v2 plain text description when API v3 returns 400', async () => {
        const jiraConfig = {
            jiraBaseUrl: 'https://jira.example.com/',
            jiraUser: 'user@example.com',
            jiraToken: 'token',
            jiraSpaceKey: 'APP',
            customer: '',
        } as const;

        (vscode.workspace as any).getConfiguration = () => ({
            get: (key: string, defaultValue: any) => (jiraConfig as any)[key] ?? defaultValue,
        });

        let fetchCount = 0;
        const capturedRequests: Array<{ url: string; body: string }> = [];

        (vscode.window as any).showInformationMessage = (_message: string, option: string) => Promise.resolve(option as any);
        (vscode.window as any).showErrorMessage = (_message: string) => Promise.resolve(undefined);
        (vscode.env as any).openExternal = async (_uri: vscode.Uri) => true;

        globalThis.fetch = async (input: any, init: any) => {
            fetchCount += 1;
            capturedRequests.push({ url: input.toString(), body: init.body });

            if (fetchCount === 1) {
                return {
                    ok: false,
                    status: 400,
                    text: async () => 'Bad Request',
                    json: async () => ({ key: 'SHOULD_NOT_BE_USED' }),
                } as any;
            }

            return {
                ok: true,
                status: 201,
                json: async () => ({ key: 'APP-456' }),
                text: async () => '',
            } as any;
        };

        const command = new CreateJiraIssueCommand();
        await command.execute(new VsCodeCommandData({} as any, {} as any, {
            title: 'Refactor module',
            findings: [
                {
                    emoji: '🐛',
                    title: 'Complex method',
                    fileLocations: [{ filePath: 'src/bar.ts' }],
                },
            ],
            sigridUrl: 'https://sigrid.example.com',
        }));

        assert.strictEqual(fetchCount, 2);
        assert.strictEqual(capturedRequests[0].url, 'https://jira.example.com/rest/api/3/issue');
        assert.strictEqual(capturedRequests[1].url, 'https://jira.example.com/rest/api/2/issue');

        const secondBody = JSON.parse(capturedRequests[1].body);
        assert.strictEqual(typeof secondBody.fields.description, 'string');
        assert.ok(secondBody.fields.description.includes('You can find more information in [Sigrid|https://sigrid.example.com].'));
    });
});
