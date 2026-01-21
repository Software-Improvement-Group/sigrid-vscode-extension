import {effect, Injectable, Signal, signal} from '@angular/core';
import {Configuration} from '../models/configuration';

@Injectable({
  providedIn: 'root',
})
export class SigridConfiguration {
  private config = signal<Configuration | null>(null);
  private isConfigValid = signal<boolean>(false);

  constructor() {
    effect(() => {
      const config = this.config();
      this.isConfigValid.set(config !== null && !!config.apiKey && !!config.customer && !!config.system);
    });
  }

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

  get isConfigurationValid(): Signal<boolean> {
    return this.isConfigValid.asReadonly();
  }
}
