import {Component, effect, inject} from '@angular/core';
import {SEVERITY_SYMBOLS} from '../severity-symbols';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SigridApi} from '../services/sigrid-api';
import {DataState} from '../models/data-state';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth {
  protected isConfigValid: boolean = false;
  protected dataState = DataState.Loading;
  protected findings: any = {};

  protected data = [
    {
      id: 'os-1',
      risk: SEVERITY_SYMBOLS['HIGH'],
      library: 'react-image-resizer',
      version: '1.4.5',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['NONE'],
      activity: SEVERITY_SYMBOLS['HIGH']
    },
    {
      id: 'os-2',
      risk: SEVERITY_SYMBOLS['HIGH'],
      library: 'some-lib-1',
      version: '1.3.2',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['HIGH'],
      activity: SEVERITY_SYMBOLS['MEDIUM']
    },
    {
      id: 'os-3',
      risk: SEVERITY_SYMBOLS['MEDIUM'],
      library: 'some-lib-2',
      version: '3.5.57',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['NONE'],
      activity: SEVERITY_SYMBOLS['MEDIUM']
    }
  ]

  private sigridApi = inject(SigridApi);

  constructor() {
    const sigridConfiguration = inject(SigridConfiguration);
    effect(() => {
      const isValidConfig = sigridConfiguration.isConfigurationValid();
      if (isValidConfig) {
        this.loadData();
      } else {
        this.dataState = DataState.Error;
      }
    });
  }

  private loadData() {
    this.sigridApi.getOpenSourceHealth().subscribe({
      next: findings => {
        this.findings = findings;
      },
      error: error => {
        this.dataState = DataState.Error;
        console.error('Error fetching open source health data:', error);
      }
    })
  }
}
