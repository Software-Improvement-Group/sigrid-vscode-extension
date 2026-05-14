import {computed, Injectable, signal} from '@angular/core';
import {Configuration} from '../models/configuration';
import {SIGRID_API_BASE_RELATIVE_URL, SIGRID_DEFAULT_URL} from '../utilities/constants';
import {joinUrl} from '../utilities/join-url';

@Injectable({
  providedIn: 'root',
})
export class SigridConfiguration {
  private config = signal<Configuration | null>(null);

  readonly isConfigurationValid = computed(() => {
    const config = this.config();
    return config !== null && !!config.apiKey && !!config.customer && !!config.system;
  });

  readonly isJiraConfigured = computed(() => {
    const config = this.config();
    return config !== null && !!config.jiraBaseUrl && !!config.jiraUser && !!config.jiraToken && !!config.jiraProjectKey;
  });

  private readonly sigridApiBaseUrl = computed(() => {
    const configuration = this.getConfigurationOrEmpty();
    return joinUrl(!!configuration.sigridUrl ? configuration.sigridUrl : SIGRID_DEFAULT_URL, SIGRID_API_BASE_RELATIVE_URL);
  });

  readonly subsystem = computed(() => {
    const configuration = this.getConfigurationOrEmpty();
    return configuration.subsystem?.trim() ?? '';
  });

  getConfiguration() {
    return this.config.asReadonly();
  }

  setConfiguration(config: Configuration) {
    this.config.set(config);
  }

  getConfigurationOrEmpty() {
    return this.getConfiguration()() ?? this.getEmptyConfiguration();
  }

  getEmptyConfiguration(): Configuration {
    return {
      apiKey: '',
      customer: '',
      system: '',
      subsystem: '',
      sigridUrl: SIGRID_DEFAULT_URL,
      jiraBaseUrl: '',
      jiraUser: '',
      jiraToken: '',
      jiraProjectKey: '',
    };
  }

  getSigridApiBaseUrl() {
    return this.sigridApiBaseUrl();
  }
}
