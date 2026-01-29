import {DataState} from '../models/data-state';
import {SigridFinding} from '../models/sigrid-finding';
import {computed, Directive, inject, OnInit, Signal} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {toObservable} from '@angular/core/rxjs-interop';

@Directive()
export abstract class FindingComponent<T> implements OnInit {
  private sigridConfiguration = inject(SigridConfiguration);
  protected isConfigValid = this.sigridConfiguration.isConfigurationValid;
  protected isConfigValid$ = toObservable<boolean>(this.sigridConfiguration.isConfigurationValid);

  protected findings = computed(() => {
    const findings = this.findingSignal();
    if (findings?.data) {
      return findings.data;
    }
    return [];
  });

  protected dataState = computed(() => {
    const findings = this.findingSignal();
    if (!findings) {
      return DataState.Loading;
    } else if (findings.data) {
      return DataState.Success;
    }
    return DataState.Error;
  });


  protected constructor(private findingSignal: Signal<SigridFinding<T> | null>) {
  }

  ngOnInit() {
    this.isConfigValid$.subscribe(isValid => {
      if (isValid) {
        this.loadData();
      }
    });
  }

  protected abstract loadData(): void;
}
