import { TestBed } from '@angular/core/testing';
import { SigridConfiguration } from './sigrid-configuration';
import { Configuration } from '../models/configuration';

describe('SigridConfiguration', () => {
  let service: SigridConfiguration;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SigridConfiguration],
    });

    service = TestBed.inject(SigridConfiguration);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isConfigurationValid is false by default (no configuration set)', () => {
    expect(service.getConfiguration()()).toBeNull();
    expect(service.isConfigurationValid()).toBe(false);
  });

  it('getEmptyConfiguration returns an object with empty apiKey/customer/system', () => {
    const empty = service.getEmptyConfiguration();

    expect(empty).toEqual({
      apiKey: '',
      customer: '',
      system: '',
    });
  });

  it('setConfiguration updates getConfiguration() signal value', () => {
    const config: Configuration = {
      apiKey: 'placeholder-api-key',
      customer: 'customer-1',
      system: 'system-1',
    };

    service.setConfiguration(config);

    expect(service.getConfiguration()()).toEqual(config);
  });

  it('isConfigurationValid becomes true only when apiKey, customer, and system are all non-empty', () => {
    service.setConfiguration({ apiKey: '', customer: 'c', system: 's' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: '', system: 's' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: 'c', system: '' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: 'c', system: 's' });
    expect(service.isConfigurationValid()).toBe(true);
  });

  it('isConfigurationValid returns false when configuration is explicitly set to empty values', () => {
    service.setConfiguration(service.getEmptyConfiguration());
    expect(service.isConfigurationValid()).toBe(false);
  });
});
