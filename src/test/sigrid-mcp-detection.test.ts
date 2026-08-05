import * as assert from 'assert';
import { mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
    containsSigridMcpServer,
    findSigridToolName,
    hasSigridMcpConfigFile,
    isSigridTool,
    isSigridToolName,
    languageModelTools,
} from '../ai-agents/sigrid-mcp-detection';
import { buildMcpConfigPaths } from '../ai-agents/mcp-config-paths';

/** The configuration the Sigrid documentation tells users to paste into VS Code. */
const DOCUMENTED_CONFIG = {
    servers: {
        Sigrid: {
            command: 'npx',
            args: ['mcp-remote', 'https://sigrid-says.com/mcp', '--header', 'Authorization: Bearer token', '--allow-http'],
        },
    },
};

function writeConfig(name: string, contents: unknown): string {
    const directory = join(tmpdir(), `sigrid-mcp-test-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    const path = join(directory, name);
    writeFileSync(path, JSON.stringify(contents), 'utf8');
    return path;
}

suite('isSigridToolName', () => {
    test('recognises a Sigrid MCP tool whose name never says "sigrid"', () => {
        assert.strictEqual(isSigridToolName('maintainability_get_findings'), true);
    });

    test('recognises a name the host prefixed with the server', () => {
        assert.strictEqual(isSigridToolName('mcp_sigrid_security_get_findings'), true);
        assert.strictEqual(isSigridToolName('SIG-MCP-Server/update_finding_status'), true);
    });

    test('still honours the plain name based rule', () => {
        assert.strictEqual(isSigridToolName('sigrid_anything'), true);
    });

    test('ignores tools from other providers', () => {
        assert.strictEqual(isSigridToolName('copilot_readFile'), false);
    });

    test('does not match a bare suffix another server could use', () => {
        assert.strictEqual(isSigridToolName('get_findings'), false);
    });
});

suite('isSigridTool', () => {
    test('accepts a neutrally named tool tagged with the server name', () => {
        assert.strictEqual(isSigridTool({ name: 'get_ratings', tags: ['mcp', 'Sigrid'] }), true);
    });

    test('ignores the description, which mentions Sigrid far too easily', () => {
        assert.strictEqual(isSigridTool({ name: 'search', tags: ['docs'] } as any), false);
    });

    test('survives tools without tags', () => {
        assert.strictEqual(isSigridTool({ name: 'guardrails_quality_check' }), true);
    });
});

suite('findSigridToolName', () => {
    let listTools: typeof languageModelTools.list;

    setup(() => {
        listTools = languageModelTools.list;
    });

    teardown(() => {
        languageModelTools.list = listTools;
    });

    test('returns the prefixed name the host actually registered', () => {
        languageModelTools.list = () => [{ name: 'mcp_sigrid_guardrails_quality_check' }];

        assert.strictEqual(findSigridToolName('guardrails_quality_check'), 'mcp_sigrid_guardrails_quality_check');
    });

    test('returns nothing when the tool is not loaded', () => {
        languageModelTools.list = () => [{ name: 'copilot_readFile' }];

        assert.strictEqual(findSigridToolName('guardrails_quality_check'), undefined);
    });

    test('does not mistake another server\'s tool for a Sigrid one', () => {
        languageModelTools.list = () => [{ name: 'jira_get_findings' }];

        assert.strictEqual(findSigridToolName('security_get_findings'), undefined);
    });

    test('reports nothing rather than throwing when no host is available', () => {
        languageModelTools.list = () => { throw new Error('no language model host'); };

        assert.strictEqual(findSigridToolName('security_get_findings'), undefined);
    });
});

suite('containsSigridMcpServer', () => {
    test('detects the documented configuration', () => {
        assert.strictEqual(containsSigridMcpServer(DOCUMENTED_CONFIG), true);
    });

    test('detects a server named after Sigrid only in its url', () => {
        const config = { servers: { 'SIG MCP Server': { url: 'https://sigrid-says.com/mcp' } } };
        assert.strictEqual(containsSigridMcpServer(config), true);
    });

    test('accepts the mcpServers alias other hosts use', () => {
        assert.strictEqual(containsSigridMcpServer({ mcpServers: { sigrid: { command: 'sigrid-mcp' } } }), true);
    });

    test('ignores unrelated servers', () => {
        const config = { servers: { github: { command: 'npx', args: ['@modelcontextprotocol/server-github'] } } };
        assert.strictEqual(containsSigridMcpServer(config), false);
    });

    test('ignores a credential that happens to contain the word', () => {
        const config = { servers: { local: { command: 'npx', env: { TOKEN: 'sigrid-secret' }, headers: { Authorization: 'sigrid' } } } };
        assert.strictEqual(containsSigridMcpServer(config), false);
    });

    test('never throws on a malformed configuration', () => {
        [undefined, null, {}, { servers: null }, { servers: 'sigrid' }, [], 'sigrid'].forEach(config => {
            assert.strictEqual(containsSigridMcpServer(config), false, `unexpected match for ${JSON.stringify(config)}`);
        });
    });
});

suite('buildMcpConfigPaths', () => {
    test('derives the default profile config next to global storage', () => {
        const storage = join('/data', 'Code', 'User', 'globalStorage', 'sig.sigrid-vscode');

        const paths = buildMcpConfigPaths(storage, []);

        assert.deepStrictEqual(paths, [join('/data', 'Code', 'User', 'mcp.json')]);
    });

    test('derives a custom profile config from the same rule', () => {
        const storage = join('/data', 'Code', 'User', 'profiles', 'abc123', 'globalStorage', 'sig.sigrid-vscode');

        const paths = buildMcpConfigPaths(storage, []);

        assert.deepStrictEqual(paths, [join('/data', 'Code', 'User', 'profiles', 'abc123', 'mcp.json')]);
    });

    test('adds a workspace config per folder, after the profile one', () => {
        const storage = join('/data', 'Code', 'User', 'globalStorage', 'sig.sigrid-vscode');

        const paths = buildMcpConfigPaths(storage, ['/repo/one', '/repo/two']);

        assert.deepStrictEqual(paths, [
            join('/data', 'Code', 'User', 'mcp.json'),
            join('/repo/one', '.vscode', 'mcp.json'),
            join('/repo/two', '.vscode', 'mcp.json'),
        ]);
    });

    test('falls back to workspace configs before activation captured the storage path', () => {
        assert.deepStrictEqual(buildMcpConfigPaths(undefined, ['/repo']), [join('/repo', '.vscode', 'mcp.json')]);
    });
});

suite('hasSigridMcpConfigFile', () => {
    test('reads a Sigrid server from disk', () => {
        assert.strictEqual(hasSigridMcpConfigFile([writeConfig('mcp.json', DOCUMENTED_CONFIG)]), true);
    });

    test('reports nothing for a configuration without Sigrid', () => {
        const path = writeConfig('mcp.json', { servers: { github: { command: 'npx' } } });

        assert.strictEqual(hasSigridMcpConfigFile([path]), false);
    });

    test('treats a missing file as not detected', () => {
        assert.strictEqual(hasSigridMcpConfigFile([join(tmpdir(), 'sigrid-mcp-test-absent', 'mcp.json')]), false);
    });
});
