import * as assert from 'assert';
import * as vscode from 'vscode';
import { UrlOpenCommand } from '../commands/url-open-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';

async function executeCommand(url: string | undefined) {
    const command = new UrlOpenCommand();
    await command.execute(new VsCodeCommandData({} as any, {} as any, url as any, {} as unknown as vscode.SecretStorage));
}

suite('UrlOpenCommand', () => {
    let originalOpenExternal: any;
    let originalShowErrorMessage: any;

    setup(() => {
        originalOpenExternal = (vscode.env as any).openExternal;
        originalShowErrorMessage = (vscode.window as any).showErrorMessage;
    });

    teardown(() => {
        (vscode.env as any).openExternal = originalOpenExternal;
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
    });

    test('opens https URLs', async () => {
        let openedUri = '';
        (vscode.env as any).openExternal = async (uri: vscode.Uri) => {
            openedUri = uri.toString();
            return true;
        };

        await executeCommand('https://sigrid-says.com/finding/1');

        assert.strictEqual(openedUri, 'https://sigrid-says.com/finding/1');
    });

    test('opens http URLs', async () => {
        let openedUri = '';
        (vscode.env as any).openExternal = async (uri: vscode.Uri) => {
            openedUri = uri.toString();
            return true;
        };

        await executeCommand('http://jira.internal/browse/APP-1');

        assert.strictEqual(openedUri, 'http://jira.internal/browse/APP-1');
    });

    for (const maliciousUrl of [
        'file:///etc/passwd',
        'vscode://foo/bar',
        'command:workbench.action.something',
        'not a url',
    ]) {
        test(`rejects ${maliciousUrl}`, async () => {
            let openExternalCalled = false;
            (vscode.env as any).openExternal = async () => {
                openExternalCalled = true;
                return true;
            };

            let errorMessage = '';
            (vscode.window as any).showErrorMessage = (message: string) => {
                errorMessage = message;
                return Promise.resolve(undefined);
            };

            await executeCommand(maliciousUrl);

            assert.strictEqual(openExternalCalled, false);
            assert.strictEqual(errorMessage, `Invalid URL: ${maliciousUrl}`);
        });
    }

    test('shows an error when no URL is provided', async () => {
        let openExternalCalled = false;
        (vscode.env as any).openExternal = async () => {
            openExternalCalled = true;
            return true;
        };

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        await executeCommand(undefined);

        assert.strictEqual(openExternalCalled, false);
        assert.strictEqual(errorMessage, 'No URL provided to open.');
    });
});
