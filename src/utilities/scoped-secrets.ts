import { SecretStorage, workspace } from "vscode";

export type SecretScope = 'global' | 'workspace';

export function getWorkspaceId(): string | undefined {
    return workspace.workspaceFile?.toString() ?? workspace.workspaceFolders?.[0]?.uri.toString();
}

export function buildScopedKey(baseKey: string, workspaceId: string): string {
    return `${baseKey}::${workspaceId}`;
}

export async function getSecret(secrets: SecretStorage, baseKey: string): Promise<string | undefined> {
    const workspaceId = getWorkspaceId();
    if (workspaceId) {
        const workspaceValue = await secrets.get(buildScopedKey(baseKey, workspaceId));
        if (workspaceValue) {
            return workspaceValue;
        }
    }

    return secrets.get(baseKey);
}

export interface SetSecretOptions {
    secrets: SecretStorage;
    baseKey: string;
    value: string;
    scope: SecretScope;
}

export async function setSecret({ secrets, baseKey, value, scope }: SetSecretOptions): Promise<void> {
    if (scope === 'workspace') {
        const workspaceId = getWorkspaceId();
        if (!workspaceId) {
            throw new Error('Cannot store a workspace-scoped secret when no workspace is open.');
        }
        await secrets.store(buildScopedKey(baseKey, workspaceId), value);
        return;
    }

    await secrets.store(baseKey, value);
}

export function getRelevantKeys(baseKey: string): string[] {
    const workspaceId = getWorkspaceId();
    return workspaceId ? [baseKey, buildScopedKey(baseKey, workspaceId)] : [baseKey];
}
