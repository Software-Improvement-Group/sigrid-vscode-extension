import {computed, Injectable, signal} from '@angular/core';
import {Configuration} from '../models/configuration';

@Injectable({
  providedIn: 'root',
})
export class SigridConfiguration {
  private config = signal<Configuration | null>(null);

  readonly isConfigurationValid = computed(() => {
    const config = this.config();
    return config !== null && !!config.apiKey && !!config.customer && !!config.system;
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
    };
  }
}
