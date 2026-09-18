import {VsCommandHandler} from './vs-command-handler';
import {Configuration} from '../models/configuration';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {UsageStatistics} from '../services/usage-statistics';
import {SystemOnboarding} from '../services/system-onboarding';

export class ConfigurationChangedCommand implements VsCommandHandler<Configuration> {
  constructor(private sigridConfig: SigridConfiguration,
              private usageStatistics: UsageStatistics, private systemOnboarding: SystemOnboarding) {
  }

  execute(payload: Configuration): void {
    this.sigridConfig.setConfiguration(payload);
    this.usageStatistics.send();
    this.systemOnboarding.check();
  }
}
