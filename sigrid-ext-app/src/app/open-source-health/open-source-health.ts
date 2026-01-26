import {Component, effect, inject, signal} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SigridApi} from '../services/sigrid-api';
import {DataState} from '../models/data-state';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {OpenSourceHealthMapper} from '../mappers/open-source-health-mapper';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth {
  protected isConfigValid: boolean = false;
  protected dataState = DataState.Loading;

  protected oshDependencies = signal<OpenSourceHealthDependency[]>([]);

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
    this.dataState = DataState.Loading;
    this.sigridApi.getOpenSourceHealthFindings().subscribe({
      next: findings => {
        this.oshDependencies.set(OpenSourceHealthMapper.map(findings));
        this.dataState = DataState.Success;
      },
      error: error => {
        this.dataState = DataState.Error;
        console.error('Error fetching open source health data:', error);
      }
    })
  }
}
