import { FixPrompt } from "./fix-prompt-builder";

/**
 * An AI coding agent this extension can hand a prompt to.
 *
 * VS Code offers no vendor-neutral way to send a prompt to an agent, so every agent needs a
 * small adapter. Everything else - deciding what to say - is shared, see `fix-prompt-builder.ts`.
 */
export interface AiAgentProvider {
    /** Stable identifier used in webview messages. */
    readonly id: string;
    /** Human readable name, shown when the user has to pick between agents. */
    readonly label: string;
    /** Whether the agent understands `/sigrid:...` slash commands from the Sigrid plugin. */
    readonly supportsSlashCommands: boolean;
    /** Whether the agent is installed and can accept a handoff. */
    isAvailable(): boolean;
    /** Best-effort check whether the Sigrid MCP server is wired up for this agent. */
    hasSigridMcp(): boolean;
    /** Opens the agent with `prompt` prefilled. Never submits it - the user does that. */
    handoff(prompt: FixPrompt): Promise<void>;
    /** Optional: drops any cached detection, for agents whose presence can change unannounced. */
    invalidate?(): void;
    /** Optional: true when a handoff types a command into a terminal instead of opening a panel. */
    usesTerminal?(): boolean;
}

/** The subset of provider state the webview needs to render the "Fix it" action. */
export interface AvailableAgent {
    id: string;
    label: string;
    mcpDetected: boolean;
}
