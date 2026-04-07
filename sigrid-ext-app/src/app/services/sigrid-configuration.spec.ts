import { TestBed } from '@angular/core/testing';
import { SigridConfiguration } from './sigrid-configuration';
import { Configuration } from '../models/configuration';
import { SIGRID_DEFAULT_URL } from '../utilities/constants';

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
      subsystem: '',
      sigridUrl: SIGRID_DEFAULT_URL,
    });
  });

  it('setConfiguration updates getConfiguration() signal value', () => {
    const config: Configuration = {
      apiKey: 'placeholder-api-key',
      customer: 'customer-1',
      system: 'system-1',
      subsystem: 'subsystem-1',
      sigridUrl: SIGRID_DEFAULT_URL,
    };

    service.setConfiguration(config);

    expect(service.getConfiguration()()).toEqual(config);
  });

  it('subsystem is trimmed and falls back to empty string', () => {
    service.setConfiguration({
      apiKey: 'k',
      customer: 'c',
      system: 's',
      subsystem: '  trimmed-subsystem  ',
      sigridUrl: SIGRID_DEFAULT_URL,
    });

    expect(service.subsystem()).toBe('trimmed-subsystem');
  });

  it('isConfigurationValid becomes true only when apiKey, customer, and system are all non-empty', () => {
    service.setConfiguration({ apiKey: '', customer: 'c', system: 's', subsystem: '', sigridUrl: SIGRID_DEFAULT_URL });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: '', system: 's', subsystem: '', sigridUrl: SIGRID_DEFAULT_URL });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: 'c', system: '', subsystem: '', sigridUrl: SIGRID_DEFAULT_URL });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ apiKey: 'k', customer: 'c', system: 's', subsystem: '', sigridUrl: SIGRID_DEFAULT_URL });
    expect(service.isConfigurationValid()).toBe(true);
  });

  it('isConfigurationValid returns false when configuration is explicitly set to empty values', () => {
    service.setConfiguration(service.getEmptyConfiguration());
    expect(service.isConfigurationValid()).toBe(false);
  });
});
