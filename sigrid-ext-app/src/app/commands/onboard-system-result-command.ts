import {VsCommandHandler} from './vs-command-handler';
import {SystemOnboarding} from '../services/system-onboarding';
import {OnboardSystemResultData} from '../models/onboard-system-result-data';

export class OnboardSystemResultCommand implements VsCommandHandler<OnboardSystemResultData> {
  constructor(private systemOnboarding: SystemOnboarding) {
  }

  execute(payload: OnboardSystemResultData): void {
    this.systemOnboarding.onOnboardResult(payload);
  }
}
