import {describe, expect, it, vi} from 'vitest';
import {OnboardSystemResultCommand} from './onboard-system-result-command';
import type {SystemOnboarding} from '../services/system-onboarding';

describe('OnboardSystemResultCommand', () => {
  it('calls SystemOnboarding.onOnboardResult with the payload', () => {
    const systemOnboardingMock: Pick<SystemOnboarding, 'onOnboardResult'> = {
      onOnboardResult: vi.fn(),
    };

    const cmd = new OnboardSystemResultCommand(systemOnboardingMock as SystemOnboarding);
    const payload = {success: true};

    cmd.execute(payload);

    expect(systemOnboardingMock.onOnboardResult).toHaveBeenCalledTimes(1);
    expect(systemOnboardingMock.onOnboardResult).toHaveBeenCalledWith(payload);
  });
});
