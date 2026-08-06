import { Terminal, ThemeIcon, Uri, window, workspace } from "vscode";
import { FixPrompt } from "./fix-prompt-builder";
import { ExecutableLocation } from "../utilities/find-executable";
import { getPromptStorageUri } from "../utilities/extension-storage";
import { getActiveWorkspacePath } from "../utilities/workspace";

const SHELL_READY_TIMEOUT_MS = 3000;

export interface CommandLineContext {
    /** Either the bare executable name or a quoted absolute path, ready to use in a command line. */
    executable: string;
    promptFile: string;
    /** Directories the agent has to be allowed to read, already including the prompt directory. */
    extraDirs: string[];
    lead: string;
}

export interface TerminalHandoffRequest {
    terminalName: string;
    prompt: FixPrompt;
    executable: ExecutableLocation;
    buildCommandLine(context: CommandLineContext): string;
}

/** Seams for tests: the file system, the clock and the shell wait. */
export const terminalDeps = {
    now: () => Date.now(),
    waitForShell,
};

interface HandoffTerminal {
    terminal: Terminal;
    /** Set once the user has pressed Enter, after which the terminal belongs to the agent. */
    used: boolean;
    subscription?: { dispose(): void };
}

let promptCounter = 0;
let previous: HandoffTerminal | undefined;

/**
 * Hands a prompt to a CLI agent by typing a command into a terminal without executing it.
 *
 * The prompt itself goes into a file rather than onto the command line: it is multi-line, and it
 * contains finding titles that come from the Sigrid API, which must never be interpreted by a shell.
 * The command line therefore only ever holds text we control plus quoted paths, which every
 * supported shell parses identically.
 */
export async function handoffViaTerminal(request: TerminalHandoffRequest, deps = terminalDeps): Promise<void> {
    const promptFile = await writePromptFile(request.prompt, deps);
    const promptDirectory = getPromptStorageUri().fsPath;

    const commandLine = request.buildCommandLine({
        executable: request.executable.onPath ? baseName(request.executable.path) : quote(request.executable.path),
        promptFile: promptFile.fsPath,
        extraDirs: [promptDirectory],
        lead: sanitizeForCommandLine(request.prompt.lead),
    });

    const terminal = createTerminal(request.terminalName);
    await deps.waitForShell(terminal);
    // Focus must land on the terminal: the user has to be able to press Enter.
    terminal.show(false);
    terminal.sendText(commandLine, false);
}

async function writePromptFile(prompt: FixPrompt, deps: typeof terminalDeps): Promise<Uri> {
    const directory = getPromptStorageUri();
    await workspace.fs.createDirectory(directory);

    // Unique per handoff: two pending terminals must not end up pointing at the same file.
    promptCounter += 1;
    const file = Uri.joinPath(directory, `sigrid-fix-${deps.now()}-${promptCounter}.md`);
    await workspace.fs.writeFile(file, Buffer.from(prompt.text, 'utf8'));

    return file;
}

/**
 * Always a fresh terminal. Reusing one is wrong: once the user has pressed Enter the terminal hosts
 * a running agent, so sending a command line to it would type a chat message instead.
 */
function createTerminal(name: string): Terminal {
    disposeUnusedTerminal();

    const terminal = window.createTerminal({
        name,
        cwd: resolveCwd(),
        iconPath: new ThemeIcon('sparkle'),
        isTransient: true,
    });

    const current: HandoffTerminal = { terminal, used: false };
    current.subscription = window.onDidStartTerminalShellExecution?.(event => {
        if (event.terminal === terminal) {
            current.used = true;
        }
    });
    previous = current;

    return terminal;
}

/**
 * Avoids piling up terminals holding commands the user never ran. Without shell integration
 * there is no reliable signal that the shell started a real process, so in that case a possibly
 * abandoned terminal is left alone rather than risk disposing one that is actually running the
 * agent.
 */
function disposeUnusedTerminal() {
    const unused = previous;
    previous = undefined;
    if (!unused) {
        return;
    }

    unused.subscription?.dispose();
    const canDetectUsage = unused.terminal.shellIntegration !== undefined;
    if (canDetectUsage && !unused.used && unused.terminal.exitStatus === undefined && window.terminals.includes(unused.terminal)) {
        unused.terminal.dispose();
    }
}

/**
 * The working directory decides which project the CLI agent sees: its instruction files, its
 * settings, and the root that finding paths are relative to.
 */
function resolveCwd(): string | undefined {
    return getActiveWorkspacePath() ?? workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/** Gives a slow shell profile a chance to finish before typing, so no characters are dropped. */
async function waitForShell(terminal: Terminal): Promise<void> {
    await terminal.processId;

    if (terminal.shellIntegration) {
        return;
    }

    await new Promise<void>(resolve => {
        const timeout = setTimeout(finish, SHELL_READY_TIMEOUT_MS);
        const subscription = window.onDidChangeTerminalShellIntegration?.(event => {
            if (event.terminal === terminal) {
                finish();
            }
        });

        function finish() {
            clearTimeout(timeout);
            subscription?.dispose();
            resolve();
        }
    });
}

function baseName(executablePath: string): string {
    return executablePath.split(/[\\/]/).pop() ?? executablePath;
}

export function quote(value: string): string {
    return `"${value.replace(/"/g, '\\"')}"`;
}

/** Strips anything a shell would act on, in case a lead instruction ever becomes dynamic. */
function sanitizeForCommandLine(value: string): string {
    return value.replace(/["`$\\!;|&()<>\r\n]/g, ' ').trim();
}
