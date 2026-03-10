import {TestBed} from '@angular/core/testing';

import {UsageStatistics} from './usage-statistics';
import {SigridConfiguration} from './sigrid-configuration';
import {VsCode} from './vs-code';

describe('UsageStatistics', () => {
  let service: UsageStatistics;
  let sigridConfigurationMock: {
    getConfiguration: ReturnType<typeof vi.fn>;
    isConfigurationValid: ReturnType<typeof vi.fn>;
  };
  let vsCodeMock: {
    sendUsageStatistics: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sigridConfigurationMock = {
      getConfiguration: vi.fn(),
      isConfigurationValid: vi.fn(),
    };
    vsCodeMock = {
      sendUsageStatistics: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UsageStatistics,
        {provide: SigridConfiguration, useValue: sigridConfigurationMock},
        {provide: VsCode, useValue: vsCodeMock},
      ],
    });

    service = TestBed.inject(UsageStatistics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('does not send usage statistics when configuration is invalid', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sigridConfigurationMock.getConfiguration.mockReturnValue(() => ({
      customer: 'customer-1',
    }));
    sigridConfigurationMock.isConfigurationValid.mockReturnValue(false);

    service.send();

    expect(vsCodeMock.sendUsageStatistics).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Configuration is not valid, not sending usage statistics');
  });

  it('does not send usage statistics when customer is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sigridConfigurationMock.getConfiguration.mockReturnValue(() => ({
      customer: '',
    }));
    sigridConfigurationMock.isConfigurationValid.mockReturnValue(true);

    service.send();

    expect(vsCodeMock.sendUsageStatistics).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Configuration is not valid, not sending usage statistics');
  });

  it('does not send usage statistics when configuration is null', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sigridConfigurationMock.getConfiguration.mockReturnValue(() => null);
    sigridConfigurationMock.isConfigurationValid.mockReturnValue(true);

    service.send();

    expect(vsCodeMock.sendUsageStatistics).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Configuration is not valid, not sending usage statistics');
  });

  it('sends usage statistics with the customer when configuration is valid', () => {
    sigridConfigurationMock.getConfiguration.mockReturnValue(() => ({
      customer: 'customer-1',
    }));
    sigridConfigurationMock.isConfigurationValid.mockReturnValue(true);

    service.send();

    expect(vsCodeMock.sendUsageStatistics).toHaveBeenCalledTimes(1);
    expect(vsCodeMock.sendUsageStatistics).toHaveBeenCalledWith({
      customer: 'customer-1',
    });
  });
});
