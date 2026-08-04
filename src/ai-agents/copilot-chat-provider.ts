import { commands, extensions } from "vscode";
import { AiAgentProvider } from "./ai-agent-provider";
import { FixPrompt } from "./fix-prompt-builder";
import { hasSigridLanguageModelTool } from "./sigrid-mcp-detection";

const COPILOT_CHAT_EXTENSION_ID = 'github.copilot-chat';
const OPEN_CHAT_COMMAND = 'workbench.action.chat.open';

/**
 * Hands off to VS Code Chat (GitHub Copilot).
 *
 * `workbench.action.chat.open` is a VS Code core command that is recommended but not part of the
 * documented API surface, hence the guard. `isPartialQuery: true` prefills without submitting.
 */
export class CopilotChatProvider implements AiAgentProvider {
    readonly id = 'copilot';
    readonly label = 'GitHub Copilot';
    readonly supportsSlashCommands = false;

    isAvailable(): boolean {
        return extensions.getExtension(COPILOT_CHAT_EXTENSION_ID) !== undefined;
    }

    hasSigridMcp(): boolean {
        return hasSigridLanguageModelTool();
    }

    async handoff(prompt: FixPrompt): Promise<void> {
        await commands.executeCommand(OPEN_CHAT_COMMAND, {
            query: prompt.text,
            isPartialQuery: true,
            mode: 'agent',
        });
    }
}
