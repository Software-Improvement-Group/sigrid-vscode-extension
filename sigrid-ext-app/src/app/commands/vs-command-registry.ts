import {VsCommandHandler} from './vs-command-handler';
import {InitializeCommand} from './initialize-command';
import {inject, Injectable} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {ActiveEditorChangedCommand} from './active-editor-changed-command';

@Injectable({
  providedIn: 'root'
})
export class VsCommandRegistry {
  private sigridConfig = inject(SigridConfiguration);

  private commands: Record<string, VsCommandHandler<unknown>> = {
    initialize: new InitializeCommand(this.sigridConfig),
    activeEditorChanged: new ActiveEditorChangedCommand(),
  }

  execute(command: string, payload: unknown) {
    this.commands[command]?.execute(payload);
  }
}
