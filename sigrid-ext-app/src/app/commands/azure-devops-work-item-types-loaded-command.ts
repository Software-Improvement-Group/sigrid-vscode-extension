import {VsCommandHandler} from './vs-command-handler';
import {AzureDevOpsWorkItemTypes} from '../services/azure-devops-work-item-types';
import {AzureDevOpsWorkItemTypesLoaded} from '../models/azure-devops-work-item-types-loaded';

export class AzureDevOpsWorkItemTypesLoadedCommand implements VsCommandHandler<AzureDevOpsWorkItemTypesLoaded> {
  constructor(private workItemTypes: AzureDevOpsWorkItemTypes) {
  }

  execute(payload: AzureDevOpsWorkItemTypesLoaded): void {
    if (payload.error) {
      this.workItemTypes.onError(payload.error);
    } else {
      this.workItemTypes.onLoaded(payload.types ?? []);
    }
  }
}
