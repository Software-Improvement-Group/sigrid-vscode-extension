import { extensions, lm } from "vscode";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { mcpConfigLocator } from "./mcp-config-paths";

/**
 * Best-effort detection of the Sigrid MCP server.
 *
 * VS Code has no API to enumerate configured MCP servers, so every check below is a heuristic.
 * They only ever decorate the prompt and the UI hint - a failed detection never blocks a handoff,
 * because the prompt embeds the findings themselves and works without MCP. A false positive only
 * drops the "MCP not detected" note from the prompt.
 *
 * On remote and web hosts the MCP server may be configured on the client, out of reach of the file
 * checks; those environments fall back to whatever `lm.tools` reports.
 */

const SIGRID = 'sigrid';
const SIGRID_CLAUDE_PLUGIN = 'sigrid@sigrid-ai-toolkit';

/** Matches "sigrid" as a whole word, so names like `sigridtest` or `mysigridwrapper` don't match. */
const SIGRID_WORD = /\bsigrid\b/i;

/**
 * The tools the Sigrid MCP server exposes, named individually so other modules (e.g. the prompt
 * builder's per-category tool hints) reference the same strings instead of re-typing them.
 */
export const SIGRID_TOOL_NAMES = {
    maintainabilityGetFindings: 'maintainability_get_findings',
    maintainabilityGetRatings: 'maintainability_get_ratings',
    securityGetFindings: 'security_get_findings',
    reliabilityGetFindings: 'reliability_get_findings',
    architectureGetInternal: 'architecture_get_internal',
    architectureGetExternalDependencies: 'architecture_get_external_dependencies',
    architectureGetWorstDirectories: 'architecture_get_worst_directories',
    opensourcehealthGetRisks: 'opensourcehealth_get_risks',
    opensourcehealthGetVulnerabilities: 'opensourcehealth_get_vulnerabilities',
    guardrailsQualityCheck: 'guardrails_quality_check',
    updateFindingStatus: 'update_finding_status',
} as const;

/**
 * Needed as a signature because none of the tool names carry the word "sigrid" - that only
 * appears in the server name, which the tool metadata does not have.
 */
const SIGRID_MCP_TOOL_NAMES: string[] = Object.values(SIGRID_TOOL_NAMES);

/** The fields of an MCP server definition that identify which server it is. */
interface McpServerDefinition {
    command?: unknown;
    args?: unknown;
    url?: unknown;
    type?: unknown;
}

/** The tool metadata this module needs, so the predicate stays testable without a language model. */
interface ToolDescription {
    name: string;
    tags?: readonly string[];
}

/**
 * The check VS Code based agents use: a live Sigrid tool, or a server that is configured but has
 * not started yet. Deliberately uncached - the only caller invalidates provider caches first.
 */
export function hasSigridMcpServer(): boolean {
    return hasSigridLanguageModelTool() || hasSigridMcpConfigFile();
}

/** Swappable seam for tests: the real tool list depends on what the host has started. */
export const languageModelTools = {
    list: (): readonly ToolDescription[] => lm.tools ?? [],
};

/**
 * Scans the language model tools VS Code knows about for a Sigrid MCP tool.
 * Note MCP tools only appear here once the server has actually started.
 */
export function hasSigridLanguageModelTool(): boolean {
    return listTools().some(isSigridTool);
}

/**
 * The name the host actually loaded a Sigrid tool under, which may carry a prefix such as
 * `mcp_sigrid_`. Needed to reference the tool in a prompt: only the real name resolves.
 */
export function findSigridToolName(toolName: string): string | undefined {
    const wanted = toolName.toLowerCase();
    return listTools().find(tool => isSigridToolName(tool.name) && tool.name.toLowerCase().endsWith(wanted))?.name;
}

function listTools(): readonly ToolDescription[] {
    try {
        return languageModelTools.list();
    } catch (error) {
        console.error('Failed to inspect language model tools:', error);
        return [];
    }
}

/** True for a Sigrid tool name, or for tags naming the Sigrid server. Ignores the description. */
export function isSigridTool(tool: ToolDescription): boolean {
    return isSigridToolName(tool.name) || (tool.tags ?? []).some(tag => tag.toLowerCase().includes(SIGRID));
}

/** Matches both `sigrid`-named tools and the MCP tool names, whatever prefix the host adds. */
export function isSigridToolName(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes(SIGRID) || SIGRID_MCP_TOOL_NAMES.some(known => lower.endsWith(known));
}

/** Whether any of the `mcp.json` files VS Code reads declares a Sigrid server. */
export function hasSigridMcpConfigFile(paths: string[] = mcpConfigLocator.paths()): boolean {
    return paths.some(path => containsSigridMcpServer(readJsonFile<unknown>(path)));
}

/** Whether a parsed `mcp.json` declares a server that looks like Sigrid. */
export function containsSigridMcpServer(config: unknown): boolean {
    return mcpServerIdentities(config).some(identity => SIGRID_WORD.test(JSON.stringify(identity)));
}

/**
 * The identifying part of every configured server: its name plus how it is reached. Credentials in
 * `env` and `headers` are left out, so a token that happens to contain "sigrid" cannot match.
 */
function mcpServerIdentities(config: unknown): unknown[] {
    const servers = (config as { servers?: unknown; mcpServers?: unknown })?.servers
        ?? (config as { mcpServers?: unknown })?.mcpServers;
    if (!servers || typeof servers !== 'object') {
        return [];
    }
    return Object.entries(servers).map(([name, definition]) => {
        const { command, args, url, type } = (definition ?? {}) as McpServerDefinition;
        return { name, command, args, url, type };
    });
}

/**
 * Checks whether the Sigrid Claude Code plugin (which provides the Sigrid MCP server and the
 * `/sigrid:...` skills) is enabled, by reading the documented plugin layout under `~/.claude`.
 */
export function hasSigridClaudePlugin(): boolean {
    const settings = readJsonFile<{ enabledPlugins?: Record<string, boolean> }>(join(homedir(), '.claude', 'settings.json'));
    if (settings?.enabledPlugins?.[SIGRID_CLAUDE_PLUGIN]) {
        return true;
    }

    const installed = readJsonFile<Record<string, unknown>>(join(homedir(), '.claude', 'plugins', 'installed_plugins.json'));
    return installed !== undefined && SIGRID_WORD.test(JSON.stringify(installed));
}

/** Whether a VS Code extension with the given id is installed, regardless of activation state. */
export function isExtensionInstalled(extensionId: string): boolean {
    return extensions.getExtension(extensionId) !== undefined;
}

function readJsonFile<T>(path: string): T | undefined {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch {
        // Missing or malformed file simply means "not detected".
        return undefined;
    }
}
