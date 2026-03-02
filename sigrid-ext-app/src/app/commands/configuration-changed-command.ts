import {VsCommandHandler} from './vs-command-handler';
import {Configuration} from '../models/configuration';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SigridData} from '../services/sigrid-data';

export class ConfigurationChangedCommand implements VsCommandHandler<Configuration> {
  constructor(private sigridConfig: SigridConfiguration, private sigridData: SigridData) {
  }

  execute(payload: Configuration): void {
    this.sigridConfig.setConfiguration(payload);
    this.sigridData.loadAllFindings();
  }
}
