import {VsCommandHandler} from './vs-command-handler';
import {InitializeCommand} from './initialize-command';
import {inject, Injectable} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {ActiveEditorChangedCommand} from './active-editor-changed-command';
import {SigridData} from '../services/sigrid-data';
import {ConfigurationChangedCommand} from './configuration-changed-command';
import {UsageStatistics} from '../services/usage-statistics';
import {WebviewBaseUriCommand} from './webview-base-uri-command';
import {AppResource} from '../services/app-resource';
import {AzureDevOpsWorkItemTypes} from '../services/azure-devops-work-item-types';
import {AzureDevOpsWorkItemTypesLoadedCommand} from './azure-devops-work-item-types-loaded-command';
import {AiAgents} from '../services/ai-agents';
import {AiAgentsDetectedCommand} from './ai-agents-detected-command';

@Injectable({
  providedIn: 'root'
})
export class VsCommandRegistry {
  private sigridConfig = inject(SigridConfiguration);
  private sigridData = inject(SigridData);
  private usageStatistics = inject(UsageStatistics);
  private appResource = inject(AppResource);
  private azureDevOpsWorkItemTypes = inject(AzureDevOpsWorkItemTypes);
  private aiAgents = inject(AiAgents);

  private commands: Record<string, VsCommandHandler<unknown>> = {
    initialize: new InitializeCommand(this.sigridConfig, this.usageStatistics),
    webviewBaseUri: new WebviewBaseUriCommand(this.appResource),
    activeEditorChanged: new ActiveEditorChangedCommand(this.sigridData),
    configurationChanged: new ConfigurationChangedCommand(this.sigridConfig, this.sigridData, this.usageStatistics),
    azureDevOpsWorkItemTypesLoaded: new AzureDevOpsWorkItemTypesLoadedCommand(this.azureDevOpsWorkItemTypes),
    aiAgentsDetected: new AiAgentsDetectedCommand(this.aiAgents),
  };

  execute(command: string, payload: unknown) {
    this.commands[command]?.execute(payload);
  }
}
