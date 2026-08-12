import { AiAgentProvider, AvailableAgent } from "./ai-agent-provider";
import { ClaudeCodeProvider } from "./claude-code-provider";
import { CopilotChatProvider } from "./copilot-chat-provider";

/** Every agent this extension can hand off to. Add a provider here to support another agent. */
export const AI_AGENTS: AiAgentProvider[] = [
    new ClaudeCodeProvider(),
    new CopilotChatProvider(),
];

/**
 * Drops cached availability lookups. Installing a CLI raises no VS Code event, so detection has to
 * be redone when something might have changed.
 */
export function invalidateAvailability() {
    AI_AGENTS.forEach(agent => agent.invalidate?.());
}

/** The agents that are currently installed, in the shape the webview needs. */
export function getAvailableAgents(): AvailableAgent[] {
    return AI_AGENTS
        .filter(agent => agent.isAvailable())
        .map(agent => ({ id: agent.id, label: agent.label, mcpDetected: agent.hasSigridMcp() }));
}

/** Resolves an installed agent by id, or undefined when it is unknown or not installed. */
export function findAvailableAgent(id: string): AiAgentProvider | undefined {
    return AI_AGENTS.find(agent => agent.id === id && agent.isAvailable());
}
