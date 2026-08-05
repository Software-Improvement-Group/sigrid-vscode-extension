import { workspace } from "vscode";
import { dirname, join } from "path";
import { getStorageUri } from "../utilities/extension-storage";

const MCP_FILE = 'mcp.json';
const WORKSPACE_FOLDER = '.vscode';

/** Swappable seam for tests: the real paths depend on the user's profile and open workspace. */
export const mcpConfigLocator = {
    paths: (): string[] => buildMcpConfigPaths(getStorageUri()?.fsPath, workspaceFolderPaths()),
};

/**
 * The `mcp.json` files VS Code reads, most general first.
 *
 * VS Code keeps `mcp.json` next to `globalStorage` inside the active profile directory, so the
 * profile directory is `dirname(dirname(globalStorageUri))` - no OS specific location to hardcode,
 * and custom profiles (`User/profiles/<id>`) fall out of the same rule.
 */
export function buildMcpConfigPaths(globalStoragePath: string | undefined, workspaceFolders: string[]): string[] {
    const profileFile = globalStoragePath ? join(dirname(dirname(globalStoragePath)), MCP_FILE) : undefined;
    const workspaceFiles = workspaceFolders.map(folder => join(folder, WORKSPACE_FOLDER, MCP_FILE));
    return profileFile ? [profileFile, ...workspaceFiles] : workspaceFiles;
}

function workspaceFolderPaths(): string[] {
    return (workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
}
