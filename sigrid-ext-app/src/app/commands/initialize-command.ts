import {Configuration} from '../models/configuration';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {VsCommandHandler} from './vs-command-handler';
import {UsageStatistics} from '../services/usage-statistics';
import {SystemOnboarding} from '../services/system-onboarding';

export class InitializeCommand implements VsCommandHandler<Configuration> {
  constructor(private sigridConfig: SigridConfiguration, private usageStatistics: UsageStatistics,
              private systemOnboarding: SystemOnboarding) {}

  execute(configuration: Configuration) {
    this.sigridConfig.setConfiguration(configuration);
    this.usageStatistics.send();
    this.systemOnboarding.check();
  }
}
