import {VsCommandHandler} from './vs-command-handler';
import {AiAgents} from '../services/ai-agents';
import {AvailableAgent} from '../models/available-agent';

export class AiAgentsDetectedCommand implements VsCommandHandler<AvailableAgent[]> {
  constructor(private aiAgents: AiAgents) {
  }

  execute(payload: AvailableAgent[]): void {
    this.aiAgents.setAgents(payload ?? []);
  }
}
