import { commands } from "vscode";
import { AiAgentProvider } from "./ai-agent-provider";
import { FixPrompt } from "./fix-prompt-builder";
import { findSigridToolName, hasSigridMcpServer, isExtensionInstalled } from "./sigrid-mcp-detection";

const COPILOT_CHAT_EXTENSION_ID = 'github.copilot-chat';
const OPEN_CHAT_COMMAND = 'workbench.action.chat.open';

/**
 * Hands off to VS Code Chat (GitHub Copilot).
 *
 * `workbench.action.chat.open` is a VS Code core command that is recommended but not part of the
 * documented API surface, hence the guard. `isPartialQuery: false` submits the query immediately
 * instead of leaving it as a draft.
 */
export class CopilotChatProvider implements AiAgentProvider {
    readonly id = 'copilot';
    readonly label = 'GitHub Copilot';
    readonly supportsSlashCommands = false;

    isAvailable(): boolean {
        return isExtensionInstalled(COPILOT_CHAT_EXTENSION_ID);
    }

    hasSigridMcp(): boolean {
        return hasSigridMcpServer();
    }

    /**
     * VS Code chat turns `#name` in the input box into a real tool attachment, but only for a tool
     * it has loaded. An unknown name would stay in the box as dead text, so it stays unreferenced.
     */
    toolReference(toolName: string): string | undefined {
        const loaded = findSigridToolName(toolName);
        return loaded ? `#${loaded}` : undefined;
    }

    async handoff(prompt: FixPrompt): Promise<void> {
        await commands.executeCommand(OPEN_CHAT_COMMAND, {
            query: prompt.text,
            isPartialQuery: false,
            mode: 'agent',
        });
    }
}
