import {VsCommandHandler} from './vs-command-handler';
import {SystemOnboarding} from '../services/system-onboarding';
import {SystemOnboardStatusData} from '../models/system-onboard-status-data';

export class SystemOnboardStatusCommand implements VsCommandHandler<SystemOnboardStatusData> {
  constructor(private systemOnboarding: SystemOnboarding) {
  }

  execute(payload: SystemOnboardStatusData): void {
    this.systemOnboarding.onCheckResult(payload);
  }
}
