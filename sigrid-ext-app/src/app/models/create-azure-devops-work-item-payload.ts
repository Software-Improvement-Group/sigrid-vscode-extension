import {IssueFinding} from './issue-finding';

export interface CreateAzureDevOpsWorkItemPayload {
  title: string;
  workItemType: string;
  findings: IssueFinding[];
  sigridUrl: string;
}
