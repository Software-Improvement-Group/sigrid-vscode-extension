import {Component, effect, inject, signal} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {DataState} from '../models/data-state';
import {SigridData} from '../services/sigrid-data';
import {SecurityFinding} from '../models/security-finding';

@Component({
  selector: 'app-security',
  imports: [],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security {
  protected dataState = DataState.Loading;
  protected securityFindings = signal<SecurityFinding[]>([]);
  private sigridData = inject(SigridData);

  constructor() {
    const sigridConfiguration = inject(SigridConfiguration);
    effect(() => {
      const findings = this.sigridData.securityFindings();
      if (!findings) {
        this.dataState = DataState.Loading;
      }
      else if (findings.data) {
        this.securityFindings.set(findings.data);
        this.dataState = DataState.Success;
      } else {
        this.dataState = DataState.Error;
      }

      const isValidConfig = sigridConfiguration.isConfigurationValid();
      if (isValidConfig) {
        this.sigridData.loadSecurityFindings();
      } else {
        this.dataState = DataState.Error;
      }
    });
  }

}
