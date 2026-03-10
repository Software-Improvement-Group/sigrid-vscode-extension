import {inject, Injectable} from '@angular/core';
import {SigridConfiguration} from './sigrid-configuration';
import {VsCode} from './vs-code';

@Injectable({
  providedIn: 'root',
})
export class UsageStatistics {
  private readonly config = inject(SigridConfiguration);
  private readonly vscode = inject(VsCode);

  send() {
    const configuration = this.config.getConfiguration()();
    if (!this.config.isConfigurationValid() || !configuration?.customer) {
      console.warn('Configuration is not valid, not sending usage statistics');
      return;
    }

    this.vscode.sendUsageStatistics({customer: configuration.customer});
  }
}
