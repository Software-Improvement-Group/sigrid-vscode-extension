import {inject, Injectable} from '@angular/core';
import {VsCode} from './vs-code';
import {AiAgents} from './ai-agents';
import {PopupMenuService} from './popup-menu-service';
import {SelectedFinding} from '../models/selected-finding';
import {AvailableAgent} from '../models/available-agent';

/**
 * Hands findings to an AI coding agent so it can fix them. Used both by the bulk action in the
 * header and by the per-row "Fix it" buttons, so the agent choice behaves the same everywhere.
 */
@Injectable({
  providedIn: 'root',
})
export class FixWithAi {
  private readonly vscode = inject(VsCode);
  private readonly aiAgents = inject(AiAgents);
  private readonly popupMenu = inject(PopupMenuService);

  readonly isAvailable = this.aiAgents.hasAgents;

  /** Resolved in the order handoffs were sent, once the host acks each `fixFindingsWithAi` message. */
  private readonly pendingHandoffs: Array<(success: boolean) => void> = [];

  /**
   * Hands off immediately when a single agent is installed, otherwise asks which one to use.
   * `onHandoff` runs once the host confirms the findings were actually handed off, so callers can
   * clear their state without losing it on a failed handoff.
   */
  fix(findings: SelectedFinding[], onHandoff?: () => void) {
    const agents = this.aiAgents.agents();
    if (findings.length === 0 || agents.length === 0) {
      return;
    }

    if (agents.length === 1) {
      this.handoff(agents[0], findings, onHandoff);
      return;
    }

    this.popupMenu.open(agents.map(agent => ({
      label: `Fix with ${agent.label}`,
      description: agent.mcpDetected ? 'Sigrid MCP detected' : undefined,
      action: () => this.handoff(agent, findings, onHandoff)
    })), this);
  }

  /** Called by the host's `fixFindingsWithAiResult` ack, oldest pending handoff first. */
  onHandoffResult(success: boolean) {
    this.pendingHandoffs.shift()?.(success);
  }

  private handoff(agent: AvailableAgent, findings: SelectedFinding[], onHandoff?: () => void) {
    this.vscode.fixFindingsWithAi({agentId: agent.id, findings});
    this.pendingHandoffs.push(success => {
      if (success) {
        onHandoff?.();
      }
    });
  }
}
