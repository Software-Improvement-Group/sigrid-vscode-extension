import { commands, env, extensions, Uri, workspace } from "vscode";
import { AiAgentProvider } from "./ai-agent-provider";
import { FixPrompt } from "./fix-prompt-builder";
import { hasSigridClaudePlugin, hasSigridLanguageModelTool } from "./sigrid-mcp-detection";
import { CommandLineContext, handoffViaTerminal, quote } from "./terminal-handoff";
import { ExecutableLocation, findExecutable } from "../utilities/find-executable";
import { EXTENSION_ID } from "../extension.config";

export const CLAUDE_CODE_AGENT_ID = 'claude-code';

const CLAUDE_CODE_EXTENSION_ID = 'anthropic.claude-code';
const CLAUDE_CLI_NAME = 'claude';
const OPEN_EDITOR_COMMAND = 'claude-vscode.editor.open';
const OPEN_URI = 'vscode://anthropic.claude-code/open?prompt=';
const HANDOFF_SETTING = 'claudeCodeHandoff';
const TERMINAL_NAME = 'Sigrid: Fix with Claude';

/** Deep link that installs the Sigrid plugin (and with it the Sigrid MCP server) in Claude Code. */
export const CLAUDE_CODE_INSTALL_SIGRID_PLUGIN_URI =
    'vscode://anthropic.claude-code/install-plugin?plugin=sigrid&marketplace=Software-Improvement-Group/sigrid-ai-toolkit';

/** Swappable seam for tests, and a cache: locating the CLI touches the file system. */
export const claudeCliLocator = {
    find: (): ExecutableLocation | undefined => findExecutable(CLAUDE_CLI_NAME),
};

type HandoffRoute = 'extension' | 'terminal';

/**
 * Hands off to Claude Code, either through its VS Code extension or, when that is not installed,
 * by typing a `claude` command into a terminal.
 *
 * The two routes are deliberately disjoint. Without the extension nothing handles the
 * `vscode://anthropic.claude-code` URI, and `openExternal` would report success while doing nothing.
 */
export class ClaudeCodeProvider implements AiAgentProvider {
    readonly id = CLAUDE_CODE_AGENT_ID;
    readonly supportsSlashCommands = true;
    private cachedCli: ExecutableLocation | undefined | 'unresolved' = 'unresolved';

    get label(): string {
        return this.resolveRoute() === 'terminal' ? 'Claude Code (CLI)' : 'Claude Code';
    }

    isAvailable(): boolean {
        return this.isExtensionInstalled() || this.findCli() !== undefined;
    }

    hasSigridMcp(): boolean {
        return hasSigridClaudePlugin() || hasSigridLanguageModelTool();
    }

    /** Forgets the cached CLI lookup, so a CLI installed mid-session is picked up. */
    invalidate() {
        this.cachedCli = 'unresolved';
    }

    /** True when the last handoff went to a terminal, so callers can explain what to do next. */
    usesTerminal(): boolean {
        return this.resolveRoute() === 'terminal';
    }

    async handoff(prompt: FixPrompt): Promise<void> {
        if (this.resolveRoute() === 'terminal') {
            return this.handoffToTerminal(prompt);
        }
        return this.handoffToExtension(prompt);
    }

    /** Honours the user's preference, but never picks a route that is not actually available. */
    private resolveRoute(): HandoffRoute {
        const preferred = workspace.getConfiguration(EXTENSION_ID).get<HandoffRoute>(HANDOFF_SETTING, 'extension');

        if (preferred === 'terminal' && this.findCli()) {
            return 'terminal';
        }
        return this.isExtensionInstalled() ? 'extension' : 'terminal';
    }

    private async handoffToExtension(prompt: FixPrompt): Promise<void> {
        try {
            // The first argument is the session id and must stay undefined: pointing at a session
            // whose panel is already open makes Claude Code discard the prompt.
            await commands.executeCommand(OPEN_EDITOR_COMMAND, undefined, prompt.text);
        } catch (error) {
            console.error(`Failed to open Claude Code via ${OPEN_EDITOR_COMMAND}, falling back to the URI handler:`, error);
            await env.openExternal(Uri.parse(OPEN_URI + encodeURIComponent(prompt.text)));
        }
    }

    private async handoffToTerminal(prompt: FixPrompt): Promise<void> {
        const cli = this.findCli();
        if (!cli) {
            throw new Error('The claude command line tool could not be found.');
        }

        await handoffViaTerminal({
            terminalName: TERMINAL_NAME,
            prompt,
            executable: cli,
            buildCommandLine: buildClaudeCommandLine,
        });
    }

    private isExtensionInstalled(): boolean {
        return extensions.getExtension(CLAUDE_CODE_EXTENSION_ID) !== undefined;
    }

    private findCli(): ExecutableLocation | undefined {
        if (this.cachedCli === 'unresolved') {
            this.cachedCli = claudeCliLocator.find();
        }
        return this.cachedCli;
    }
}

/**
 * `claude [options] [prompt]` accepts the prompt positionally, but `--add-dir` is variadic and would
 * swallow it, so every option has to come after the prompt.
 */
function buildClaudeCommandLine({ executable, promptFile, extraDirs, lead }: CommandLineContext): string {
    const message = `${lead} The findings to fix are described in ${promptFile}. Read that file first.`;
    const parts = [executable, quote(message)];

    if (extraDirs.length > 0) {
        parts.push('--add-dir', ...extraDirs.map(quote));
    }

    return parts.join(' ');
}
