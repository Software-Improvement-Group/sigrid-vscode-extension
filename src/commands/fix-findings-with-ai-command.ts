import { env, Uri, window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { FixFindingsPayload } from "./fix-findings-payload";
import { findAvailableAgent } from "../ai-agents/ai-agent-registry";
import { AiAgentProvider } from "../ai-agents/ai-agent-provider";
import { buildFixPrompt, FixPrompt } from "../ai-agents/fix-prompt-builder";
import { getSigridConfiguration } from "../utilities/configuration";
import { trackUsage } from "../utilities/usage-statistics";

const TERMINAL_HINT = 'The Claude Code prompt was typed into the terminal - review it and press Enter to start.';

/** Hands the selected findings to an AI coding agent as a prefilled prompt. */
export class FixFindingsWithAiCommand implements VsCodeCommand<FixFindingsPayload> {
    private readonly shownHints = new Set<string>();

    async execute(data: VsCodeCommandData<FixFindingsPayload>) {
        const success = await this.tryHandoff(data.payload);
        data.webview.postMessage({ command: 'fixFindingsWithAiResult', data: { success } });
    }

    /** Reports whether the findings were actually handed off, so the caller can react to a webview ack. */
    private async tryHandoff(payload: FixFindingsPayload | undefined): Promise<boolean> {
        if (!payload?.findings?.length) {
            window.showErrorMessage('Select at least one finding to fix with an AI agent.');
            return false;
        }

        const agent = findAvailableAgent(payload.agentId);
        if (!agent) {
            window.showErrorMessage(`AI agent "${payload.agentId}" is not available. Make sure it is installed and can be found.`);
            return false;
        }

        const config = getSigridConfiguration();
        const mcpDetected = agent.hasSigridMcp();
        const prompt = buildFixPrompt(payload.findings, config, {
            supportsSlashCommands: agent.supportsSlashCommands,
            mcpDetected,
            resolveToolReference: toolName => agent.toolReference?.(toolName),
        });

        const usesTerminal = agent.usesTerminal?.() ?? false;
        const handedOff = await this.handoff(agent, prompt);
        if (handedOff) {
            trackUsage(config.customer, 'fixWithAi');
            this.explainTerminalHandoff(agent.id, usesTerminal);
            if (!mcpDetected) {
                await this.suggestMcpInstall(agent);
            }
        }
        return handedOff;
    }

    /** A terminal that quietly opens with unexecuted text needs saying once per agent. */
    private explainTerminalHandoff(agentId: string, usesTerminal: boolean) {
        if (!usesTerminal || !this.showHintOnce(`${agentId}:terminal`)) {
            return;
        }
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

    /** Nudges the user towards an agent's MCP install flow once per agent, never blocking the handoff. */
    private async suggestMcpInstall(agent: AiAgentProvider) {
        const hint = agent.getMcpInstallHint?.();
        if (!hint || !this.showHintOnce(`${agent.id}:mcpInstall`)) {
            return;
        }

        try {
            const action = await window.showInformationMessage(hint.message, hint.action);
            if (action === hint.action) {
                await env.openExternal(Uri.parse(hint.uri));
            }
        } catch (error) {
            console.error(`Failed to open the MCP install link for ${agent.label}:`, error);
        }
    }

    /** True the first time `key` is shown; false on every later call for the same key. */
    private showHintOnce(key: string): boolean {
        if (this.shownHints.has(key)) {
            return false;
        }
        this.shownHints.add(key);
        return true;
    }
}
