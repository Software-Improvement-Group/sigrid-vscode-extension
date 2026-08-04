import { env, Uri, window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { FixFindingsPayload } from "./fix-findings-payload";
import { findAvailableAgent } from "../ai-agents/ai-agent-registry";
import { AiAgentProvider } from "../ai-agents/ai-agent-provider";
import { buildFixPrompt, FixPrompt } from "../ai-agents/fix-prompt-builder";
import { CLAUDE_CODE_AGENT_ID, CLAUDE_CODE_INSTALL_SIGRID_PLUGIN_URI } from "../ai-agents/claude-code-provider";
import { getSigridConfiguration } from "../utilities/configuration";
import { trackUsage } from "../utilities/usage-statistics";

const INSTALL_PLUGIN_ACTION = 'Install Sigrid Plugin';
const TERMINAL_HINT = 'The Claude Code prompt was typed into the terminal - review it and press Enter to start.';

/** Hands the selected findings to an AI coding agent as a prefilled prompt. */
export class FixFindingsWithAiCommand implements VsCodeCommand<FixFindingsPayload> {
    private pluginHintShown = false;
    private terminalHintShown = false;

    async execute(data: VsCodeCommandData<FixFindingsPayload>) {
        const payload = data.payload;
        if (!payload?.findings?.length) {
            window.showErrorMessage('Select at least one finding to fix with an AI agent.');
            return;
        }

        const agent = findAvailableAgent(payload.agentId);
        if (!agent) {
            window.showErrorMessage(`AI agent "${payload.agentId}" is not available. Make sure it is installed and can be found.`);
            return;
        }

        const config = getSigridConfiguration();
        const mcpDetected = agent.hasSigridMcp();
        const prompt = buildFixPrompt(payload.findings, config, {
            supportsSlashCommands: agent.supportsSlashCommands,
            mcpDetected,
        });

        const usesTerminal = agent.usesTerminal?.() ?? false;
        if (await this.handoff(agent, prompt)) {
            trackUsage(config.customer, 'fixWithAi');
            this.explainTerminalHandoff(usesTerminal);
            if (!mcpDetected) {
                this.suggestSigridPlugin(agent.id);
            }
        }
    }

    /** A terminal that quietly opens with unexecuted text needs saying once. */
    private explainTerminalHandoff(usesTerminal: boolean) {
        if (!usesTerminal || this.terminalHintShown) {
            return;
        }
        this.terminalHintShown = true;
        window.showInformationMessage(TERMINAL_HINT);
    }

    private async handoff(agent: AiAgentProvider, prompt: FixPrompt): Promise<boolean> {
        try {
            await agent.handoff(prompt);
            return true;
        } catch (error) {
            console.error(`Failed to hand off findings to ${agent.label}:`, error);
            window.showErrorMessage(`Could not open ${agent.label}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    /** Nudges the user towards the Sigrid plugin once per session, never blocking the handoff. */
    private async suggestSigridPlugin(agentId: string) {
        if (this.pluginHintShown || agentId !== CLAUDE_CODE_AGENT_ID) {
            return;
        }
        this.pluginHintShown = true;

        const action = await window.showInformationMessage(
            'The Sigrid MCP server was not detected. Installing the Sigrid plugin lets your agent query Sigrid directly.',
            INSTALL_PLUGIN_ACTION);

        if (action === INSTALL_PLUGIN_ACTION) {
            env.openExternal(Uri.parse(CLAUDE_CODE_INSTALL_SIGRID_PLUGIN_URI));
        }
    }
}
