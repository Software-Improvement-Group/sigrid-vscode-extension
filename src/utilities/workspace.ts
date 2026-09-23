import path from "path";
import { Uri, WorkspaceFolder, window, workspace } from "vscode";

function getActiveWorkspace() {
    if (window.activeTextEditor) {
        const activeEditorPath = window.activeTextEditor.document.uri.fsPath;
        const matchingWorkspace = workspace.workspaceFolders?.find((wsFolder) => {
            const relative = path.relative(wsFolder.uri.fsPath, activeEditorPath);
            return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
        });
        return matchingWorkspace;
    }

    return undefined;
}

export function getActiveWorkspacePath() {
    const activeWorkspace = getActiveWorkspace();
    if (activeWorkspace) {
        return activeWorkspace.uri.fsPath;
    }
    return undefined;
}

/**
 * Returns the relative path from the active workspace root to the given filePath.
 * @param filePath The absolute file path to convert to a relative path based on the active workspace. If no active workspace is found, this will simply return the original filePath.
 * @returns The relative path from the active workspace root to the given filePath, or filePath if no active workspace is found.
 */
export function getRelativePath(filePath: string) {
    const activeWorkspace = getActiveWorkspace();
    if (activeWorkspace) {
        return path.relative(activeWorkspace.uri.fsPath, filePath);
    }

    return filePath;
}

/**
 * Resolves filePath as a literal relative path against each workspace folder, rejecting
 * any path that would escape the folder (e.g. via ".." segments).
 * @param filePath The relative file path to resolve within the workspace.
 * @returns The resolved Uri if filePath stays within a workspace folder, otherwise undefined.
 */
export function resolveWorkspaceFile(filePath: string): Uri | undefined {
    for (const folder of workspace.workspaceFolders ?? []) {
        const candidate = Uri.joinPath(folder.uri, filePath);
        if (isContainedIn(folder, candidate)) {
            return candidate;
        }
    }

    return undefined;
}

function isContainedIn(folder: WorkspaceFolder, candidate: Uri): boolean {
    const relative = path.relative(folder.uri.fsPath, candidate.fsPath);
    return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}
