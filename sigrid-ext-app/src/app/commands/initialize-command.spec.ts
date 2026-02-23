import {describe, expect, it, vi} from 'vitest';
import {InitializeCommand} from './initialize-command';
import type {Configuration} from '../models/configuration';
import type {SigridConfiguration} from '../services/sigrid-configuration';

describe('InitializeCommand', () => {
  it('calls SigridConfiguration.setConfiguration with the provided configuration', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const cmd = new InitializeCommand(sigridConfigMock as SigridConfiguration);

    const cfg: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
    };

    cmd.execute(cfg);

    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledTimes(1);
    expect(sigridConfigMock.setConfiguration).toHaveBeenCalledWith(cfg);
  });

  it('passes the same object reference through (no cloning)', () => {
    const sigridConfigMock: Pick<SigridConfiguration, 'setConfiguration'> = {
      setConfiguration: vi.fn(),
    };

    const cmd = new InitializeCommand(sigridConfigMock as SigridConfiguration);

    const cfg: Configuration = {
      apiKey: '<api-key>',
      customer: 'acme',
      system: 'my-system',
    };

    cmd.execute(cfg);

    const passed = (sigridConfigMock.setConfiguration as any).mock.calls[0][0] as Configuration;
    expect(passed).toBe(cfg);
  });
});
