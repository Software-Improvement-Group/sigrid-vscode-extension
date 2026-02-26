import {Configuration} from '../models/configuration';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {VsCommandHandler} from './vs-command-handler';

export class InitializeCommand implements VsCommandHandler<Configuration> {
  constructor(private sigridConfig: SigridConfiguration) {}

  execute(configuration: Configuration) {
    this.sigridConfig.setConfiguration(configuration);
  }
}
