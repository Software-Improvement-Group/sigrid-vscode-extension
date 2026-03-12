import {VsCommandHandler} from './vs-command-handler';
import {InitializeCommand} from './initialize-command';
import {inject, Injectable} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {ActiveEditorChangedCommand} from './active-editor-changed-command';
import {SigridData} from '../services/sigrid-data';
import {ConfigurationChangedCommand} from './configuration-changed-command';
import {UsageStatistics} from '../services/usage-statistics';

@Injectable({
  providedIn: 'root'
})
export class VsCommandRegistry {
  private sigridConfig = inject(SigridConfiguration);
  private sigridData = inject(SigridData);
  private usageStatistics = inject(UsageStatistics);

  private commands: Record<string, VsCommandHandler<unknown>> = {
    initialize: new InitializeCommand(this.sigridConfig, this.usageStatistics),
    activeEditorChanged: new ActiveEditorChangedCommand(this.sigridData),
    configurationChanged: new ConfigurationChangedCommand(this.sigridConfig, this.sigridData, this.usageStatistics),
  };

  execute(command: string, payload: unknown) {
    this.commands[command]?.execute(payload);
  }
}
