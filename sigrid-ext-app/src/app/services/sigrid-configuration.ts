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

  private readonly sigridApiBaseUrl = computed(() => {
    const configuration = this.getConfiguration()() ?? this.getEmptyConfiguration();
    return joinUrl(!!configuration.sigridUrl ? configuration.sigridUrl : SIGRID_DEFAULT_URL, SIGRID_API_BASE_RELATIVE_URL);
  });

  getConfiguration() {
    return this.config.asReadonly();
  }

  setConfiguration(config: Configuration) {
    this.config.set(config);
  }

  getEmptyConfiguration(): Configuration {
    return {
      apiKey: '',
      customer: '',
      system: '',
      sigridUrl: SIGRID_DEFAULT_URL
    };
  }

  getSigridApiBaseUrl() {
    return this.sigridApiBaseUrl();
  }
}
