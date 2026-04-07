import {describe, expect, it, vi} from 'vitest';
import {InitializeCommand} from './initialize-command';
import type {Configuration} from '../models/configuration';
import type {SigridConfiguration} from '../services/sigrid-configuration';
import {UsageStatistics} from '../services/usage-statistics';

describe('InitializeCommand', () => {
  it('calls SigridConfiguration.setConfiguration with the provided configuration', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const usageStatisticsMock: Pick<UsageStatistics, 'send'> = {
      send: vi.fn(),
    };

    const cmd = new InitializeCommand(
      sigridConfigMock as SigridConfiguration,
      usageStatisticsMock as UsageStatistics
    );

    const cfg: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
      subsystem: 'my-subsystem',
      sigridUrl: 'https://example.invalid',
    };

    cmd.execute(cfg);

    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledTimes(1);
    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledWith(cfg);
  });

  it('passes the same object reference through (no cloning)', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const usageStatisticsMock: Pick<UsageStatistics, 'send'> = {
      send: vi.fn(),
    };

    const cmd = new InitializeCommand(
      sigridConfigMock as SigridConfiguration,
      usageStatisticsMock as UsageStatistics,
    );

    const cfg: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
      subsystem: 'my-subsystem',
      sigridUrl: 'https://example.invalid',
    };

    cmd.execute(cfg);

    const passed = (sigridConfigMock.setConfiguration as any).mock.calls[0][0] as Configuration;
    expect(passed).toBe(cfg);
  });
});
