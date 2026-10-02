import {computed, Injectable, signal} from '@angular/core';
import {Configuration} from '../models/configuration';
import {SIGRID_DEFAULT_URL} from '../utilities/constants';

@Injectable({
  providedIn: 'root',
})
export class SigridConfiguration {
  private config = signal<Configuration | null>(null);

  readonly isConfigurationValid = computed(() => {
    const config = this.config();
    return config !== null && config.hasApiKey && !!config.customer && !!config.system;
  });

  readonly isJiraConfigured = computed(() => {
    const config = this.config();
    return config !== null && !!config.jiraBaseUrl && !!config.jiraUser && config.hasJiraToken && !!config.jiraProjectKey;
  });

  readonly isAzureDevOpsConfigured = computed(() => {
    const config = this.config();
    return config !== null && !!config.azureDevOpsOrganizationUrl && config.hasAzureDevOpsToken && !!config.azureDevOpsProjectName;
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
      hasApiKey: false,
      customer: '',
      system: '',
      subsystem: '',
      sigridUrl: SIGRID_DEFAULT_URL,
      jiraBaseUrl: '',
      jiraUser: '',
      hasJiraToken: false,
      jiraProjectKey: '',
      azureDevOpsOrganizationUrl: '',
      hasAzureDevOpsToken: false,
      azureDevOpsProjectName: '',
    };
  }
}
