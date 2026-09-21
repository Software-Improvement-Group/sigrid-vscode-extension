import {describe, expect, it, vi} from 'vitest';
import {SystemOnboardStatusCommand} from './system-onboard-status-command';
import type {SystemOnboarding} from '../services/system-onboarding';

describe('SystemOnboardStatusCommand', () => {
  it('calls SystemOnboarding.onCheckResult with the payload', () => {
    const systemOnboardingMock: Pick<SystemOnboarding, 'onCheckResult'> = {
      onCheckResult: vi.fn(),
    };

    const cmd = new SystemOnboardStatusCommand(systemOnboardingMock as SystemOnboarding);
    const payload = {status: 'onboarded' as const};

    cmd.execute(payload);

    expect(systemOnboardingMock.onCheckResult).toHaveBeenCalledTimes(1);
    expect(systemOnboardingMock.onCheckResult).toHaveBeenCalledWith(payload);
  });
});
