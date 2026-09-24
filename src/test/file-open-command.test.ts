import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileOpenCommand } from '../commands/file-open-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';
import { setActiveTextEditor, setWorkspaceFolders, setWorkspaceFs } from './test-helpers';

const WORKSPACE_ROOT = '/workspace/project';

function setupWorkspaceFolders(rootFsPath: string = WORKSPACE_ROOT) {
    setWorkspaceFolders([
        { uri: vscode.Uri.file(rootFsPath), name: 'project', index: 0 },
    ] as any);
}

function setupExistingFile(existingFsPaths: string[]) {
    setWorkspaceFs({
        stat: async (uri: vscode.Uri) => {
            if (existingFsPaths.includes(uri.fsPath)) {
                return {} as vscode.FileStat;
            }
            throw new Error('File not found');
        },
    });
}

async function executeCommand(payload: { filePath: string; startLine?: number; endLine?: number }) {
    const command = new FileOpenCommand();
    await command.execute(new VsCodeCommandData({} as any, {} as any, payload, {} as any));
}

suite('FileOpenCommand', () => {
    let originalWorkspaceFolders: any;
    let originalFs: any;
    let originalShowErrorMessage: any;
    let originalOpenTextDocument: any;
    let originalShowTextDocument: any;
    let originalActiveTextEditor: any;

    setup(() => {
        originalWorkspaceFolders = (vscode.workspace as any).workspaceFolders;
        originalFs = (vscode.workspace as any).fs;
        originalShowErrorMessage = (vscode.window as any).showErrorMessage;
        originalOpenTextDocument = (vscode.workspace as any).openTextDocument;
        originalShowTextDocument = (vscode.window as any).showTextDocument;
        originalActiveTextEditor = (vscode.window as any).activeTextEditor;
    });

    teardown(() => {
        setWorkspaceFolders(originalWorkspaceFolders);
        setWorkspaceFs(originalFs);
        (vscode.window as any).showErrorMessage = originalShowErrorMessage;
        (vscode.workspace as any).openTextDocument = originalOpenTextDocument;
        (vscode.window as any).showTextDocument = originalShowTextDocument;
        setActiveTextEditor(originalActiveTextEditor);
    });

    test('opens a legitimate relative path within the workspace', async () => {
        setupWorkspaceFolders();
        const targetFsPath = vscode.Uri.file(`${WORKSPACE_ROOT}/src/foo.ts`).fsPath;
        setupExistingFile([targetFsPath]);

        let openedFsPath = '';
        (vscode.workspace as any).openTextDocument = async (uri: vscode.Uri) => {
            openedFsPath = uri.fsPath;
            return {} as vscode.TextDocument;
        };
        let shownDocument = false;
        (vscode.window as any).showTextDocument = async () => {
            shownDocument = true;
            return {} as vscode.TextEditor;
        };
        setActiveTextEditor({ selection: {}, revealRange: () => undefined } as any);

        await executeCommand({ filePath: 'src/foo.ts', startLine: 5 });

        assert.strictEqual(openedFsPath, targetFsPath);
        assert.strictEqual(shownDocument, true);
    });

    test('rejects a path traversal attempt', async () => {
        setupWorkspaceFolders();
        setupExistingFile([]);

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };
        let openCalled = false;
        (vscode.workspace as any).openTextDocument = async () => {
            openCalled = true;
            return {} as vscode.TextDocument;
        };

        await executeCommand({ filePath: '../../etc/passwd' });

        assert.strictEqual(openCalled, false);
        assert.ok(errorMessage.startsWith('Error opening file:'));
    });

    test('treats glob metacharacters as literal path segments', async () => {
        setupWorkspaceFolders();
        setupExistingFile([]);

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };
        let openCalled = false;
        (vscode.workspace as any).openTextDocument = async () => {
            openCalled = true;
            return {} as vscode.TextDocument;
        };

        await executeCommand({ filePath: '{src,test}/*.ts' });

        assert.strictEqual(openCalled, false);
        assert.ok(errorMessage.startsWith('Error opening file:'));
    });

    test('shows an error when filePath is empty', async () => {
        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        await executeCommand({ filePath: '' });

        assert.strictEqual(errorMessage, 'No file path provided to open.');
    });

    test('shows an error when there are no workspace folders', async () => {
        setWorkspaceFolders(undefined);

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        await executeCommand({ filePath: 'src/foo.ts' });

        assert.ok(errorMessage.startsWith('Error opening file:'));
    });
});
