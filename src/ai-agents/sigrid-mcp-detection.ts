import { lm } from "vscode";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Best-effort detection of the Sigrid MCP server.
 *
 * VS Code has no API to enumerate configured MCP servers, so both checks below are heuristics.
 * They only ever decorate the prompt and the UI hint - a failed detection never blocks a handoff,
 * because the prompt embeds the findings themselves and works without MCP.
 */

const SIGRID = 'sigrid';
const SIGRID_CLAUDE_PLUGIN = 'sigrid@sigrid-ai-toolkit';

/**
 * Scans the language model tools VS Code knows about for a Sigrid MCP tool.
 * Note MCP tools only appear here once the server has actually started.
 */
export function hasSigridLanguageModelTool(): boolean {
    try {
        return (lm.tools ?? []).some(tool => tool.name.toLowerCase().includes(SIGRID));
    } catch (error) {
        console.error('Failed to inspect language model tools:', error);
        return false;
    }
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
    return installed !== undefined && JSON.stringify(installed).toLowerCase().includes(SIGRID);
}

function readJsonFile<T>(path: string): T | undefined {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch {
        // Missing or malformed file simply means "not detected".
        return undefined;
    }
}
