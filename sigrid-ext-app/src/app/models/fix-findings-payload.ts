import {SelectedFinding} from './selected-finding';

export interface FixFindingsPayload {
  agentId: string;
  findings: SelectedFinding[];
}
