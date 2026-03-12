import {FindingStatus, MaintainabilityFindingStatus} from './finding-status';

export interface FindingRequest<T extends FindingStatus | MaintainabilityFindingStatus> {
  status?: T;
  remark?: string | null;
}
