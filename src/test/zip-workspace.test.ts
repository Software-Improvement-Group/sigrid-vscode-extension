import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { createWorkspaceZip } from '../utilities/zip-workspace';

suite('createWorkspaceZip', () => {
    let workspaceRoot: string;

    setup(() => {
        workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-workspace-test-'));
        fs.writeFileSync(path.join(workspaceRoot, 'index.ts'), 'export const a = 1;');
        fs.mkdirSync(path.join(workspaceRoot, 'src'));
        fs.writeFileSync(path.join(workspaceRoot, 'src', 'file.ts'), 'export const b = 2;');
        fs.mkdirSync(path.join(workspaceRoot, 'node_modules'));
        fs.writeFileSync(path.join(workspaceRoot, 'node_modules', 'dep.js'), 'module.exports = {};');
        fs.mkdirSync(path.join(workspaceRoot, '.git'));
        fs.writeFileSync(path.join(workspaceRoot, '.git', 'HEAD'), 'ref: refs/heads/main');
        fs.writeFileSync(path.join(workspaceRoot, '.gitignore'), 'node_modules\n');
    });

    teardown(() => {
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
    });

    test('produces a non-empty zip buffer', async () => {
        const zip = await createWorkspaceZip(workspaceRoot);
        assert.ok(zip.length > 0);
        assert.strictEqual(zip.subarray(0, 2).toString('latin1'), 'PK');
    });

    test('includes files not covered by .gitignore', async () => {
        const zip = await createWorkspaceZip(workspaceRoot);
        const entryNames = new AdmZip(zip).getEntries().map(entry => entry.entryName);

        assert.ok(entryNames.includes('index.ts'));
        assert.ok(entryNames.includes('src/file.ts'));
    });

    test('excludes files covered by .gitignore and the .git directory', async () => {
        const zip = await createWorkspaceZip(workspaceRoot);
        const entryNames = new AdmZip(zip).getEntries().map(entry => entry.entryName);

        assert.ok(!entryNames.some(name => name.startsWith('node_modules/')));
        assert.ok(!entryNames.some(name => name.startsWith('.git/')));
    });
});
