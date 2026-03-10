import {describe, expect, it, vi} from 'vitest';
import {ConfigurationChangedCommand} from './configuration-changed-command';
import type {Configuration} from '../models/configuration';
import type {SigridConfiguration} from '../services/sigrid-configuration';
import type {SigridData} from '../services/sigrid-data';
import {UsageStatistics} from '../services/usage-statistics';

describe('ConfigurationChangedCommand', () => {
  it('calls SigridConfiguration.setConfiguration with the provided payload', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const sigridDataMock: Pick<SigridData, 'loadAllFindings'> = {
      loadAllFindings: vi.fn(),
    };

    const usageStatisticsMock: Pick<UsageStatistics, 'send'> = {
      send: vi.fn(),
    };

    const cmd = new ConfigurationChangedCommand(
      sigridConfigMock as SigridConfiguration,
      sigridDataMock as SigridData,
      usageStatisticsMock as UsageStatistics,
    );

    const payload: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
      sigridUrl: 'https://example.invalid',
    };

    cmd.execute(payload);

    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledTimes(1);
    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledWith(payload);
  });

  it('triggers a reload of findings after applying configuration', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const sigridDataMock: Pick<SigridData, 'loadAllFindings'> = {
      loadAllFindings: vi.fn(),
    };

    const usageStatisticsMock: Pick<UsageStatistics, 'send'> = {
      send: vi.fn(),
    };

    const cmd = new ConfigurationChangedCommand(
      sigridConfigMock as SigridConfiguration,
      sigridDataMock as SigridData,
      usageStatisticsMock as UsageStatistics,
    );

    const payload: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
      sigridUrl: 'https://example.invalid',
    };

    cmd.execute(payload);

    expect(sigridDataMock.loadAllFindings).toHaveBeenCalledTimes(1);

    const setOrder = (sigridConfigMock.setConfiguration as any).mock.invocationCallOrder[0] as number;
    const loadOrder = (sigridDataMock.loadAllFindings as any).mock.invocationCallOrder[0] as number;
    expect(setOrder).toBeLessThan(loadOrder);
  });
});
