import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildScopedKey, getSecret, getWorkspaceId, setSecret } from '../utilities/scoped-secrets';
import { setWorkspaceFolders } from './test-helpers';

const BASE_KEY = 'sigrid-vscode.apiKey';
const TEST_WORKSPACE_URI = 'file:///test-workspace';

function mockOpenWorkspace() {
    const original = (vscode.workspace as any).workspaceFolders;
    setWorkspaceFolders([{ uri: vscode.Uri.parse(TEST_WORKSPACE_URI) }] as any);
    return () => setWorkspaceFolders(original);
}

function makeFakeSecretStorage() {
    const store: Record<string, string | undefined> = {};
    return {
        get: async (key: string) => store[key],
        store: async (key: string, value: string) => { store[key] = value; },
        delete: async (key: string) => { delete store[key]; },
        onDidChange: () => ({ dispose: () => { } }),
        get valueStore() { return store; },
    } as unknown as vscode.SecretStorage;
}

suite('scoped-secrets', () => {
    let originalWorkspaceFolders: any;

    setup(() => {
        originalWorkspaceFolders = (vscode.workspace as any).workspaceFolders;
        setWorkspaceFolders(undefined);
    });

    teardown(() => {
        setWorkspaceFolders(originalWorkspaceFolders);
    });

    test('getSecret falls back to the global value when no workspace is open', async () => {
        const secrets = makeFakeSecretStorage();
        await setSecret({ secrets, baseKey: BASE_KEY, value: 'global-value', scope: 'global' });

        assert.strictEqual(await getSecret(secrets, BASE_KEY), 'global-value');
        assert.strictEqual(getWorkspaceId(), undefined);
    });

    test('getSecret prefers a workspace-scoped value over the global value', async () => {
        const restoreWorkspace = mockOpenWorkspace();
        try {
            const secrets = makeFakeSecretStorage();
            await setSecret({ secrets, baseKey: BASE_KEY, value: 'global-value', scope: 'global' });
            await setSecret({ secrets, baseKey: BASE_KEY, value: 'workspace-value', scope: 'workspace' });

            assert.strictEqual(await getSecret(secrets, BASE_KEY), 'workspace-value');
            assert.strictEqual(await secrets.get(BASE_KEY), 'global-value');
            assert.strictEqual(await secrets.get(buildScopedKey(BASE_KEY, TEST_WORKSPACE_URI)), 'workspace-value');
        } finally {
            restoreWorkspace();
        }
    });

    test('getSecret falls back to the global value when no workspace-scoped value is set', async () => {
        const restoreWorkspace = mockOpenWorkspace();
        try {
            const secrets = makeFakeSecretStorage();
            await setSecret({ secrets, baseKey: BASE_KEY, value: 'global-value', scope: 'global' });

            assert.strictEqual(await getSecret(secrets, BASE_KEY), 'global-value');
        } finally {
            restoreWorkspace();
        }
    });

    test('setSecret throws when storing a workspace-scoped value with no workspace open', async () => {
        const secrets = makeFakeSecretStorage();

        await assert.rejects(() => setSecret({ secrets, baseKey: BASE_KEY, value: 'value', scope: 'workspace' }));
    });
});
