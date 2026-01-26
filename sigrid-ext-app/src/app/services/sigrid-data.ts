import {inject, Injectable, signal} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {SecurityFinding} from '../models/security-finding';
import {SigridApi} from './sigrid-api';
import {SigridFinding} from '../models/sigrid-finding';
import {SecurityFindingMapper} from '../mappers/security-finding-mapper';

@Injectable({
  providedIn: 'root',
})
export class SigridData {
  readonly openSourceHealthFindings = signal<OpenSourceHealthDependency[] | null>(null);
  private readonly _securityFindings = signal<SigridFinding<SecurityFinding[]> | null>(null);
  private readonly sigridApi = inject(SigridApi);

  loadSecurityFindings(forceRefresh?: boolean) {
    if (!forceRefresh && this.securityFindings()) {
      return;
    }

    this.sigridApi.getSecurityFindings().subscribe({
      next: result => {

        this._securityFindings.set({data: SecurityFindingMapper.map(result)} as SigridFinding<SecurityFinding[]>)
      },
      error: error => {
        console.error(error);
        this._securityFindings.set({error: 'Error occurred while fetching security findings.'} as SigridFinding<SecurityFinding[]>);
      }
    });
  }

  get securityFindings() {
    return this._securityFindings.asReadonly();
  }

}
