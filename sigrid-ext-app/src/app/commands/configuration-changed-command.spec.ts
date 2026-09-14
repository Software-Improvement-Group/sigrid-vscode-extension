import {describe, expect, it, vi} from 'vitest';
import {ConfigurationChangedCommand} from './configuration-changed-command';
import type {Configuration} from '../models/configuration';
import type {SigridConfiguration} from '../services/sigrid-configuration';
import {UsageStatistics} from '../services/usage-statistics';
import type {SystemOnboarding} from '../services/system-onboarding';

describe('ConfigurationChangedCommand', () => {
  const createPayload = (): Configuration => ({
    apiKey: '<api-key>',
    customer: 'acme',
    system: 'my-system',
    subsystem: 'my-subsystem',
    sigridUrl: 'https://example.invalid',
    jiraBaseUrl: 'https://jira.example.invalid',
    jiraUser: 'jira-user',
    jiraToken: 'jira-token',
    jiraProjectKey: 'SIG',
    azureDevOpsOrganizationUrl: 'https://dev.azure.com/acme',
    azureDevOpsPersonalAccessToken: 'azure-token',
    azureDevOpsProjectName: 'my-project',
  });

  const createCommand = () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const usageStatisticsMock: Pick<UsageStatistics, 'send'> = {
      send: vi.fn(),
    };

    const systemOnboardingMock: Pick<SystemOnboarding, 'check'> = {
      check: vi.fn(),
    };

    const cmd = new ConfigurationChangedCommand(
      sigridConfigMock as SigridConfiguration,
      usageStatisticsMock as UsageStatistics,
      systemOnboardingMock as SystemOnboarding,
    );

    return {cmd, sigridConfigMock, usageStatisticsMock, systemOnboardingMock};
  };

  it('calls SigridConfiguration.setConfiguration with the provided payload', () => {
    const {cmd, sigridConfigMock} = createCommand();
    const payload = createPayload();

    cmd.execute(payload);

    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledTimes(1);
    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledWith(payload);
  });

  it('sends usage statistics and re-checks system onboarding after applying configuration', () => {
    const {cmd, sigridConfigMock, usageStatisticsMock, systemOnboardingMock} = createCommand();
    const payload = createPayload();

    cmd.execute(payload);

    expect(usageStatisticsMock.send).toHaveBeenCalledTimes(1);
    expect(systemOnboardingMock.check).toHaveBeenCalledTimes(1);

    const setOrder = (sigridConfigMock.setConfiguration as any).mock.invocationCallOrder[0] as number;
    const checkOrder = (systemOnboardingMock.check as any).mock.invocationCallOrder[0] as number;
    expect(setOrder).toBeLessThan(checkOrder);
  });
});
