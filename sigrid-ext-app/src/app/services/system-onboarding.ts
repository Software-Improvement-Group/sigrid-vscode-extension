import {inject, Injectable, signal} from '@angular/core';
import {SystemOnboardStatusData} from '../models/system-onboard-status-data';
import {OnboardSystemResultData} from '../models/onboard-system-result-data';
import {VsCode} from './vs-code';

export type SystemOnboardingStatus = 'checking' | 'onboarded' | 'not-onboarded' | 'onboarding' | 'onboarding-started' | 'error';

@Injectable({
  providedIn: 'root',
})
export class SystemOnboarding {
  private readonly vscode = inject(VsCode);
  private readonly _status = signal<SystemOnboardingStatus>('checking');
  private readonly _errorMessage = signal<string | null>(null);
  private hasStartedOnboarding = false;

  readonly status = this._status.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  check() {
    this._status.set('checking');
    this._errorMessage.set(null);
    this.vscode.checkSystemOnboarded();
  }

  onboard() {
    this._status.set('onboarding');
    this._errorMessage.set(null);
    this.vscode.onboardSystem();
  }

  onCheckResult(data: SystemOnboardStatusData) {
    if (data.status === 'not-onboarded' && this.hasStartedOnboarding) {
      // The system existence check can't distinguish "never onboarded" from
      // "onboarding just started and Sigrid hasn't finished provisioning it yet".
      this._status.set('onboarding-started');
      this._errorMessage.set(null);
      return;
    }
    this._status.set(data.status);
    this._errorMessage.set(data.message ?? null);
  }

  onOnboardResult(data: OnboardSystemResultData) {
    if (data.success) {
      this.hasStartedOnboarding = true;
      this._status.set('onboarding-started');
      this._errorMessage.set(null);
    } else {
      this._status.set('error');
      this._errorMessage.set(data.error ?? 'Onboarding failed.');
    }
  }
}
