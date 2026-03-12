import {VsCommandHandler} from './vs-command-handler';
import {Configuration} from '../models/configuration';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SigridData} from '../services/sigrid-data';
import {UsageStatistics} from '../services/usage-statistics';

export class ConfigurationChangedCommand implements VsCommandHandler<Configuration> {
  constructor(private sigridConfig: SigridConfiguration, private sigridData: SigridData,
              private usageStatistics: UsageStatistics) {
  }

  execute(payload: Configuration): void {
    this.sigridConfig.setConfiguration(payload);
    this.sigridData.loadAllFindings();
    this.usageStatistics.send();
  }
}
