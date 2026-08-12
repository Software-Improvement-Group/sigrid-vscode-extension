import * as assert from 'assert';
import * as vscode from 'vscode';
import { FixFindingsWithAiCommand } from '../commands/fix-findings-with-ai-command';
import { VsCodeCommandData } from '../commands/vscode-command-data';
import { FixFinding, FixFindingsPayload } from '../commands/fix-findings-payload';
import { buildFixPrompt } from '../ai-agents/fix-prompt-builder';
import { claudeCliLocator } from '../ai-agents/claude-code-provider';
import { getAvailableAgents, invalidateAvailability } from '../ai-agents/ai-agent-registry';
import { languageModelTools } from '../ai-agents/sigrid-mcp-detection';
import { mcpConfigLocator } from '../ai-agents/mcp-config-paths';
import { terminalDeps } from '../ai-agents/terminal-handoff';
import { setStorageUri } from '../utilities/extension-storage';
import { ExecutableLocation } from '../utilities/find-executable';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code';
const COPILOT_CHAT_EXTENSION_ID = 'github.copilot-chat';

const MAINTAINABILITY_FINDING: FixFinding = {
    id: 'finding-1',
    category: 'Maintainability',
    title: 'src/panels/sigrid-panel.ts: Unit size',
    severity: 'VERY_HIGH',
    fileLocations: [{ filePath: 'src/panels/sigrid-panel.ts', startLine: 120, endLine: 198 }],
};

const SECURITY_FINDING: FixFinding = {
    id: 'finding-2',
    category: 'Security',
    title: 'src/commands/create-jira-issue-command.ts: Hardcoded secret',
    severity: 'HIGH',
    fileLocations: [{ filePath: 'src/commands/create-jira-issue-command.ts', startLine: 44 }],
};

const OSH_FINDING: FixFinding = {
    id: 'pkg:npm/lodash@4.17.0',
    category: 'Open Source Health',
    title: 'lodash 4.17.0',
    severity: 'HIGH',
    fileLocations: [{ filePath: 'package.json' }],
};

function setupInstalledExtensions(...ids: string[]) {
    (vscode.extensions as any).getExtension = (id: string) => ids.includes(id) ? ({ id } as any) : undefined;
}

/** The providers cache their lookups, so every change of the environment has to invalidate them. */
function setupCli(location?: ExecutableLocation) {
    claudeCliLocator.find = () => location;
    invalidateAvailability();
}

/** Captures every executeCommand call, optionally failing the first one to test fallbacks. */
function captureExecuteCommand(options: { throwOnCall?: boolean } = {}) {
    const calls: any[][] = [];
    (vscode.commands as any).executeCommand = (...args: any[]) => {
        calls.push(args);
        return options.throwOnCall ? Promise.reject(new Error('command not found')) : Promise.resolve(undefined);
    };
    return calls;
}

/** Writes an mcp.json declaring the Sigrid server and points the locator at it. */
function setupMcpConfigFile(contents: unknown) {
    const directory = join(tmpdir(), `sigrid-mcp-config-${Date.now()}`);
    mkdirSync(directory, { recursive: true });
    const path = join(directory, 'mcp.json');
    writeFileSync(path, JSON.stringify(contents), 'utf8');
    mcpConfigLocator.paths = () => [path];
}

async function executeCommand(payload: FixFindingsPayload) {
    const command = new FixFindingsWithAiCommand();
    await command.execute(new VsCodeCommandData({} as any, {} as any, payload));
}

suite('FixFindingsWithAiCommand', () => {
    let originals: Record<string, any> = {};

    setup(() => {
        originals = {
            getExtension: (vscode.extensions as any).getExtension,
            executeCommand: (vscode.commands as any).executeCommand,
            getConfiguration: (vscode.workspace as any).getConfiguration,
            showErrorMessage: (vscode.window as any).showErrorMessage,
            showInformationMessage: (vscode.window as any).showInformationMessage,
            openExternal: (vscode.env as any).openExternal,
            fetch: globalThis.fetch,
            findCli: claudeCliLocator.find,
            listTools: languageModelTools.list,
            mcpConfigPaths: mcpConfigLocator.paths,
        };

        // No CLI unless a test says otherwise, so the extension route is what gets exercised.
        setupCli(undefined);
        // No Sigrid MCP unless a test says otherwise, so the machine running the tests cannot
        // decide the outcome with its own running server or its own mcp.json.
        languageModelTools.list = () => [];
        mcpConfigLocator.paths = () => [];
        (vscode.workspace as any).getConfiguration = () => ({
            get: (key: string, defaultValue: any) => key === 'system' ? 'my-system' : defaultValue,
        });
        (vscode.window as any).showErrorMessage = (_message: string) => Promise.resolve(undefined);
        (vscode.window as any).showInformationMessage = (_message: string) => Promise.resolve(undefined);
        (vscode.env as any).openExternal = async (_uri: vscode.Uri) => true;
        // Keep usage statistics off the network.
        globalThis.fetch = (async () => ({ ok: true })) as any;
    });

    teardown(() => {
        (vscode.extensions as any).getExtension = originals.getExtension;
        (vscode.commands as any).executeCommand = originals.executeCommand;
        (vscode.workspace as any).getConfiguration = originals.getConfiguration;
        (vscode.window as any).showErrorMessage = originals.showErrorMessage;
        (vscode.window as any).showInformationMessage = originals.showInformationMessage;
        (vscode.env as any).openExternal = originals.openExternal;
        globalThis.fetch = originals.fetch;
        claudeCliLocator.find = originals.findCli;
        languageModelTools.list = originals.listTools;
        mcpConfigLocator.paths = originals.mcpConfigPaths;
        invalidateAvailability();
    });

    test('prefills the Claude Code editor with a prompt and no session id', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 1);
        const [commandId, sessionId, prompt] = calls[0];
        assert.strictEqual(commandId, 'claude-vscode.editor.open');
        assert.strictEqual(sessionId, undefined, 'a session id would make Claude Code drop the prompt');
        assert.ok(prompt.includes('src/panels/sigrid-panel.ts:120-198'));
    });

    test('falls back to the Claude Code URI handler when the command is unavailable', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        captureExecuteCommand({ throwOnCall: true });

        let openedUri: vscode.Uri | undefined;
        (vscode.env as any).openExternal = async (uri: vscode.Uri) => {
            openedUri = uri;
            return true;
        };

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.ok(openedUri, 'expected a fallback to the URI handler');
        assert.strictEqual(openedUri.scheme, 'vscode');
        assert.strictEqual(openedUri.authority, 'anthropic.claude-code');
        assert.strictEqual(openedUri.path, '/open');
        // The URI handler reads the prompt off the query, which is what has to survive encoding.
        const prompt = new URLSearchParams(openedUri.query).get('prompt') ?? '';
        assert.ok(prompt.startsWith('/sigrid:sigrid-improve'));
        assert.ok(prompt.includes('src/panels/sigrid-panel.ts:120-198'));
    });

    test('opens VS Code chat in agent mode and submits the prompt automatically', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'copilot', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 1);
        const [commandId, options] = calls[0];
        assert.strictEqual(commandId, 'workbench.action.chat.open');
        assert.strictEqual(options.isPartialQuery, false, 'the prompt must be submitted, not left as a draft');
        assert.strictEqual(options.mode, 'agent');
        assert.ok(!options.query.includes('/sigrid:'), 'Copilot does not understand Sigrid slash commands');
    });

    test('reports an error and hands off nothing when the agent is not installed', async () => {
        setupInstalledExtensions();
        const calls = captureExecuteCommand();

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 0);
        assert.ok(errorMessage.includes('claude-code'));
    });

    test('reports Sigrid MCP for Copilot when a Sigrid tool is loaded', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);
        // The Sigrid MCP tool names carry no "sigrid" - only the server name does.
        languageModelTools.list = () => [{ name: 'maintainability_get_findings', tags: [] }];

        const copilot = getAvailableAgents().find(agent => agent.id === 'copilot');

        assert.strictEqual(copilot?.mcpDetected, true);
    });

    test('reports Sigrid MCP for Copilot from mcp.json when no tool is loaded yet', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);
        setupMcpConfigFile({ servers: { Sigrid: { command: 'npx', args: ['mcp-remote', 'https://sigrid-says.com/mcp'] } } });

        const copilot = getAvailableAgents().find(agent => agent.id === 'copilot');

        assert.strictEqual(copilot?.mcpDetected, true);
    });

    test('reports no Sigrid MCP for Copilot without a tool or a configured server', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);

        const copilot = getAvailableAgents().find(agent => agent.id === 'copilot');

        assert.strictEqual(copilot?.mcpDetected, false);
    });

    test('references the loaded Sigrid tools in the Copilot prompt, under their real names', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);
        languageModelTools.list = () => [
            { name: 'mcp_sigrid_maintainability_get_findings', tags: [] },
            { name: 'mcp_sigrid_guardrails_quality_check', tags: [] },
        ];
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'copilot', findings: [MAINTAINABILITY_FINDING] });

        const query = calls[0][1].query;
        assert.ok(query.includes('#mcp_sigrid_maintainability_get_findings'), query);
        assert.ok(query.includes('#mcp_sigrid_guardrails_quality_check'), query);
    });

    test('names a configured but unloaded tool without a dead # reference', async () => {
        setupInstalledExtensions(COPILOT_CHAT_EXTENSION_ID);
        setupMcpConfigFile({ servers: { Sigrid: { command: 'npx', args: ['mcp-remote', 'https://sigrid-says.com/mcp'] } } });
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'copilot', findings: [MAINTAINABILITY_FINDING] });

        const query = calls[0][1].query;
        assert.ok(query.includes('maintainability_get_findings'), query);
        assert.ok(!query.includes('#'), 'an unresolved reference would sit in the chat box as plain text');
    });

    test('never judges Claude Code by the MCP servers configured in VS Code', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        let configRead = false;
        mcpConfigLocator.paths = () => {
            configRead = true;
            return [];
        };

        getAvailableAgents();

        assert.strictEqual(configRead, false, 'VS Code mcp.json configures VS Code, not Claude Code');
    });

    test('reports an error when there are no findings to fix', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        const calls = captureExecuteCommand();

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = (message: string) => {
            errorMessage = message;
            return Promise.resolve(undefined);
        };

        await executeCommand({ agentId: 'claude-code', findings: [] });

        assert.strictEqual(calls.length, 0);
        assert.ok(errorMessage.length > 0);
    });
});

interface FakeTerminal {
    creationOptions: any;
    sent: { text: string; shouldExecute?: boolean }[];
    shown: boolean;
}

function createFakeTerminal(): FakeTerminal & Record<string, any> {
    return {
        creationOptions: undefined,
        sent: [],
        shown: false,
        processId: Promise.resolve(1234),
        shellIntegration: {},
        exitStatus: undefined,
        show(_preserveFocus?: boolean) { this.shown = true; },
        sendText(text: string, shouldExecute?: boolean) { this.sent.push({ text, shouldExecute }); },
        dispose() { },
    };
}

suite('FixFindingsWithAiCommand - Claude CLI fallback', () => {
    const cliOnPath: ExecutableLocation = { path: '/opt/homebrew/bin/claude', onPath: true };
    let originals: Record<string, any> = {};
    let terminals: (FakeTerminal & Record<string, any>)[] = [];
    let storageDirectory = '';

    function setupHandoffSetting(value: 'extension' | 'terminal') {
        (vscode.workspace as any).getConfiguration = () => ({
            get: (key: string, defaultValue: any) => {
                if (key === 'system') { return 'my-system'; }
                if (key === 'claudeCodeHandoff') { return value; }
                return defaultValue;
            },
        });
    }

    setup(() => {
        originals = {
            getExtension: (vscode.extensions as any).getExtension,
            executeCommand: (vscode.commands as any).executeCommand,
            getConfiguration: (vscode.workspace as any).getConfiguration,
            createTerminal: (vscode.window as any).createTerminal,
            showInformationMessage: (vscode.window as any).showInformationMessage,
            showErrorMessage: (vscode.window as any).showErrorMessage,
            waitForShell: terminalDeps.waitForShell,
            findCli: claudeCliLocator.find,
            fetch: globalThis.fetch,
        };

        terminals = [];
        (vscode.window as any).createTerminal = (options: any) => {
            const terminal = createFakeTerminal();
            terminal.creationOptions = options;
            terminals.push(terminal);
            return terminal;
        };
        (vscode.window as any).showInformationMessage = (_message: string) => Promise.resolve(undefined);
        (vscode.window as any).showErrorMessage = (_message: string) => Promise.resolve(undefined);
        // Tests must not wait on a real shell.
        terminalDeps.waitForShell = async () => { };
        globalThis.fetch = (async () => ({ ok: true })) as any;

        storageDirectory = join(tmpdir(), `sigrid-test-${Date.now()}`);
        setStorageUri(vscode.Uri.file(storageDirectory));
        setupHandoffSetting('extension');
    });

    teardown(() => {
        (vscode.extensions as any).getExtension = originals.getExtension;
        (vscode.commands as any).executeCommand = originals.executeCommand;
        (vscode.workspace as any).getConfiguration = originals.getConfiguration;
        (vscode.window as any).createTerminal = originals.createTerminal;
        (vscode.window as any).showInformationMessage = originals.showInformationMessage;
        (vscode.window as any).showErrorMessage = originals.showErrorMessage;
        terminalDeps.waitForShell = originals.waitForShell;
        claudeCliLocator.find = originals.findCli;
        globalThis.fetch = originals.fetch;
        invalidateAvailability();
    });

    test('offers Claude Code when only the CLI is installed', async () => {
        setupInstalledExtensions();
        setupCli(cliOnPath);

        const agents = getAvailableAgents();

        assert.deepStrictEqual(agents.map(agent => agent.id), ['claude-code']);
        assert.strictEqual(agents[0].label, 'Claude Code (CLI)', 'the label should say the terminal will be used');
    });

    test('types the command into a terminal and runs it immediately', async () => {
        setupInstalledExtensions();
        setupCli(cliOnPath);
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 0, 'the extension route must not be used without the extension');
        assert.strictEqual(terminals.length, 1);
        const [sent] = terminals[0].sent;
        assert.strictEqual(sent.shouldExecute, true, 'the command must run immediately, not wait for the user');
        assert.ok(terminals[0].shown, 'the terminal must be focused so the user sees the agent start');
    });

    test('builds a single-line command with the prompt before the options', async () => {
        setupInstalledExtensions();
        setupCli(cliOnPath);

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        const commandLine = terminals[0].sent[0].text;
        assert.ok(!commandLine.includes('\n'), 'a newline would submit the command early');
        // Found on PATH, so the bare name works and is more portable than an absolute path.
        assert.ok(commandLine.startsWith('claude "'), `unexpected command: ${commandLine}`);
        assert.ok(commandLine.includes('/sigrid:sigrid-improve autonomous'));
        // --add-dir is variadic and would swallow the prompt if it came first.
        assert.ok(commandLine.indexOf('--add-dir') > commandLine.indexOf('/sigrid:'), 'options must follow the prompt');
    });

    test('quotes the absolute path when the CLI was not found on PATH', async () => {
        setupInstalledExtensions();
        setupCli({ path: '/Users/tester/.claude/local/claude', onPath: false });

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.ok(terminals[0].sent[0].text.startsWith('"/Users/tester/.claude/local/claude" "'));
    });

    test('writes the full prompt to a file the agent is pointed at', async () => {
        setupInstalledExtensions();
        setupCli(cliOnPath);

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        const commandLine = terminals[0].sent[0].text;
        const promptFile = commandLine.match(/(\S+\.md)\./)?.[1];
        assert.ok(promptFile, `no prompt file in: ${commandLine}`);

        const contents = readFileSync(promptFile, 'utf8');
        assert.ok(contents.startsWith('/sigrid:sigrid-improve autonomous'));
        assert.ok(contents.includes('src/panels/sigrid-panel.ts:120-198'));
        assert.ok(contents.includes('\n'), 'the file carries the multi-line prompt the command line cannot');
    });

    test('uses a fresh terminal and a fresh prompt file for every handoff', async () => {
        setupInstalledExtensions();
        setupCli(cliOnPath);

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });
        await executeCommand({ agentId: 'claude-code', findings: [SECURITY_FINDING] });

        assert.strictEqual(terminals.length, 2, 'a reused terminal could already be running an agent');
        assert.notStrictEqual(terminals[0].sent[0].text, terminals[1].sent[0].text);
    });

    test('prefers the extension when both are available', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        setupCli(cliOnPath);
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0][0], 'claude-vscode.editor.open');
        assert.strictEqual(terminals.length, 0);
    });

    test('uses the terminal even with the extension installed when configured to', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        setupCli(cliOnPath);
        setupHandoffSetting('terminal');
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 0);
        assert.strictEqual(terminals.length, 1);
    });

    test('falls back to the extension when the terminal is configured but no CLI exists', async () => {
        setupInstalledExtensions(CLAUDE_CODE_EXTENSION_ID);
        setupCli(undefined);
        setupHandoffSetting('terminal');
        const calls = captureExecuteCommand();

        await executeCommand({ agentId: 'claude-code', findings: [MAINTAINABILITY_FINDING] });

        assert.strictEqual(calls.length, 1, 'the setting must never leave the user without a route');
        assert.strictEqual(terminals.length, 0);
    });
});

suite('buildFixPrompt', () => {
    const context = { customer: 'my-customer', system: 'my-system' };
    const slashAgent = { supportsSlashCommands: true, mcpDetected: true };
    const plainAgent = { supportsSlashCommands: false, mcpDetected: true };

    test('uses the maintainability skill for a maintainability-only selection', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, slashAgent).text;

        assert.ok(prompt.startsWith('/sigrid:sigrid-improve autonomous'));
        assert.ok(prompt.includes('Customer: my-customer'));
        assert.ok(prompt.includes('System: my-system'));
    });

    test('uses the open source health skill for a dependency-only selection', () => {
        const prompt = buildFixPrompt([OSH_FINDING], context, slashAgent).text;

        assert.ok(prompt.startsWith('/sigrid:fix-osh-risk'));
        assert.ok(prompt.includes('Locations: package.json'));
    });

    test('falls back to a plain instruction for security findings, which have no skill', () => {
        const prompt = buildFixPrompt([SECURITY_FINDING], context, slashAgent).text;

        assert.ok(!prompt.includes('/sigrid:'));
        assert.ok(prompt.startsWith('Fix the following Sigrid security findings.'));
    });

    test('falls back to a plain instruction for a mixed selection', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING, OSH_FINDING], context, slashAgent).text;

        assert.ok(!prompt.includes('/sigrid:'));
        assert.ok(prompt.includes('1. Maintainability / VERY_HIGH'));
        assert.ok(prompt.includes('2. Open Source Health / HIGH'));
    });

    test('never uses slash commands for agents that do not support them', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, { supportsSlashCommands: false, mcpDetected: true }).text;

        assert.ok(!prompt.includes('/sigrid:'));
        assert.ok(prompt.startsWith('Fix the following Sigrid maintainability findings.'));
    });

    test('formats a single line location without a range', () => {
        const prompt = buildFixPrompt([SECURITY_FINDING], context, slashAgent).text;

        assert.ok(prompt.includes('Locations: src/commands/create-jira-issue-command.ts:44'));
    });

    test('tells the agent to work from the findings when Sigrid MCP was not detected', () => {
        const withMcp = buildFixPrompt([MAINTAINABILITY_FINDING], context, { supportsSlashCommands: true, mcpDetected: true }).text;
        const withoutMcp = buildFixPrompt([MAINTAINABILITY_FINDING], context, { supportsSlashCommands: true, mcpDetected: false }).text;

        assert.ok(!withMcp.includes('was not detected'));
        assert.ok(withoutMcp.includes('Sigrid MCP server and Sigrid skills were not detected'));
        assert.ok(withoutMcp.includes('sigrid-ai-toolkit#install'));
    });

    test('prepends the install notice ahead of the lead instruction', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, { supportsSlashCommands: true, mcpDetected: false }).text;

        assert.ok(prompt.startsWith('Note: the Sigrid MCP server and Sigrid skills were not detected'));
    });

    test('falls back to a plain lead instead of a skill command when the plugin is not detected', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, { supportsSlashCommands: true, mcpDetected: false });

        assert.ok(!prompt.lead.startsWith('/sigrid:'));
        assert.strictEqual(prompt.lead, 'Fix the following Sigrid maintainability findings.');
    });

    test('tells an agent without a Sigrid skill which MCP tools to use', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, plainAgent).text;

        assert.ok(prompt.includes('The Sigrid MCP server is available'));
        assert.ok(prompt.includes('maintainability_get_findings'));
        assert.ok(prompt.includes('guardrails_quality_check'));
    });

    test('leaves MCP orchestration to the Sigrid skill when one drives the session', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, slashAgent).text;

        assert.ok(prompt.startsWith('/sigrid:'));
        assert.ok(!prompt.includes('The Sigrid MCP server is available'));
    });

    test('names no tools when Sigrid MCP was not detected', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, { ...plainAgent, mcpDetected: false }).text;

        assert.ok(!prompt.includes('maintainability_get_findings'));
        assert.ok(prompt.includes('Sigrid MCP server and Sigrid skills were not detected'));
    });

    test('names the tools of the selected category, not of every category', () => {
        const prompt = buildFixPrompt([SECURITY_FINDING], context, plainAgent).text;

        assert.ok(prompt.includes('security_get_findings'));
        assert.ok(!prompt.includes('maintainability_get_findings'));
    });

    test('skips the quality gate for dependency work, which changes no code of ours', () => {
        const prompt = buildFixPrompt([OSH_FINDING], context, plainAgent).text;

        assert.ok(prompt.includes('opensourcehealth_get_risks'));
        assert.ok(prompt.includes('opensourcehealth_get_vulnerabilities'));
        assert.ok(!prompt.includes('guardrails_quality_check'));
    });

    test('names each tool once for a mixed selection', () => {
        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING, SECURITY_FINDING], context, plainAgent).text;

        assert.ok(prompt.includes('maintainability_get_findings'));
        assert.ok(prompt.includes('security_get_findings'));
        assert.strictEqual(prompt.split('guardrails_quality_check').length - 1, 1);
    });

    test('never asks an agent to write a finding status back to Sigrid', () => {
        [MAINTAINABILITY_FINDING, SECURITY_FINDING, OSH_FINDING].forEach(finding => {
            [plainAgent, slashAgent].forEach(options => {
                const prompt = buildFixPrompt([finding], context, options).text;
                assert.ok(!prompt.includes('update_finding_status'), `${finding.category} / ${options.supportsSlashCommands}`);
            });
        });
    });

    test('renders tool references for agents that link tools', () => {
        const options = { ...plainAgent, resolveToolReference: (tool: string) => `#${tool}` };

        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, options).text;

        assert.ok(prompt.includes('#maintainability_get_findings'));
        assert.ok(prompt.includes('#guardrails_quality_check'));
    });

    test('falls back to plain tool names when the agent cannot link them', () => {
        const options = { ...plainAgent, resolveToolReference: () => undefined };

        const prompt = buildFixPrompt([MAINTAINABILITY_FINDING], context, options).text;

        assert.ok(prompt.includes('maintainability_get_findings'));
        assert.ok(!prompt.includes('#'));
    });
});

