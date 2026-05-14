import { TestBed } from '@angular/core/testing';
import { SigridConfiguration } from './sigrid-configuration';
import { Configuration } from '../models/configuration';
import { SIGRID_DEFAULT_URL } from '../utilities/constants';

describe('SigridConfiguration', () => {
  let service: SigridConfiguration;

  const validBaseConfiguration: Configuration = {
    apiKey: 'k',
    customer: 'c',
    system: 's',
    subsystem: '',
    sigridUrl: SIGRID_DEFAULT_URL,
    jiraBaseUrl: '',
    jiraUser: '',
    jiraToken: '',
    jiraProjectKey: '',
  };

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

  it('isJiraConfigured is false by default (no configuration set)', () => {
    expect(service.getConfiguration()()).toBeNull();
    expect(service.isJiraConfigured()).toBe(false);
  });

  it('getEmptyConfiguration returns an object with empty values and default Sigrid URL', () => {
    const empty = service.getEmptyConfiguration();

    expect(empty).toEqual({
      apiKey: '',
      customer: '',
      system: '',
      subsystem: '',
      sigridUrl: SIGRID_DEFAULT_URL,
      jiraBaseUrl: '',
      jiraUser: '',
      jiraToken: '',
      jiraProjectKey: '',
    });
  });

  it('setConfiguration updates getConfiguration() signal value', () => {
    const config: Configuration = {
      apiKey: 'placeholder-api-key',
      customer: 'customer-1',
      system: 'system-1',
      subsystem: 'subsystem-1',
      sigridUrl: SIGRID_DEFAULT_URL,
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    };

    service.setConfiguration(config);

    expect(service.getConfiguration()()).toEqual(config);
  });

  it('subsystem is trimmed and falls back to empty string', () => {
    service.setConfiguration({
      ...validBaseConfiguration,
      subsystem: '  trimmed-subsystem  ',
    });

    expect(service.subsystem()).toBe('trimmed-subsystem');
  });

  it('isConfigurationValid becomes true only when apiKey, customer, and system are all non-empty', () => {
    service.setConfiguration({ ...validBaseConfiguration, apiKey: '' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ ...validBaseConfiguration, customer: '' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration({ ...validBaseConfiguration, system: '' });
    expect(service.isConfigurationValid()).toBe(false);

    service.setConfiguration(validBaseConfiguration);
    expect(service.isConfigurationValid()).toBe(true);
  });

  it('isConfigurationValid returns false when configuration is explicitly set to empty values', () => {
    service.setConfiguration(service.getEmptyConfiguration());
    expect(service.isConfigurationValid()).toBe(false);
  });

  it('isJiraConfigured becomes true only when all Jira settings are non-empty', () => {
    service.setConfiguration({
      ...validBaseConfiguration,
      jiraBaseUrl: '',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    });
    expect(service.isJiraConfigured()).toBe(false);

    service.setConfiguration({
      ...validBaseConfiguration,
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: '',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    });
    expect(service.isJiraConfigured()).toBe(false);

    service.setConfiguration({
      ...validBaseConfiguration,
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: '',
      jiraProjectKey: 'SIG',
    });
    expect(service.isJiraConfigured()).toBe(false);

    service.setConfiguration({
      ...validBaseConfiguration,
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: '',
    });
    expect(service.isJiraConfigured()).toBe(false);

    service.setConfiguration({
      ...validBaseConfiguration,
      jiraBaseUrl: 'https://jira.example.com',
      jiraUser: 'user@example.com',
      jiraToken: 'token',
      jiraProjectKey: 'SIG',
    });
    expect(service.isJiraConfigured()).toBe(true);
  });
});
