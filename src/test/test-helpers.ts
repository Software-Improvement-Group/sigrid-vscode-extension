import * as vscode from 'vscode';

/**
 * Several `vscode.workspace` properties (`workspaceFolders`, `fs`, ...) are accessor-only on recent
 * VS Code test hosts, so a direct assignment throws. Redefining them keeps the existing
 * setup/teardown mocking pattern working.
 */
function defineWorkspaceProperty(key: keyof typeof vscode.workspace, value: unknown): void {
    Object.defineProperty(vscode.workspace, key, {
        value,
        configurable: true,
        enumerable: true,
    });
}

export function setWorkspaceFolders(folders: readonly vscode.WorkspaceFolder[] | undefined): void {
    defineWorkspaceProperty('workspaceFolders', folders);
}

export function setWorkspaceFs(fs: unknown): void {
    defineWorkspaceProperty('fs', fs);
}

export function setActiveTextEditor(editor: vscode.TextEditor | undefined): void {
    Object.defineProperty(vscode.window, 'activeTextEditor', {
        value: editor,
        configurable: true,
        enumerable: true,
    });
}

/**
 * The VS Code extension host redirects `console.error` to its own log channel by making it a
 * non-writable property, so a direct assignment silently no-ops. Redefining it lets tests capture
 * the call.
 */
export function setConsoleError(fn: typeof console.error): void {
    Object.defineProperty(console, 'error', {
        value: fn,
        configurable: true,
        enumerable: true,
        writable: true,
    });
}
