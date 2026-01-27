import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {SecurityFinding} from '../models/security-finding';
import {SigridApi} from './sigrid-api';
import {SigridFinding} from '../models/sigrid-finding';
import {SecurityFindingMapper} from '../mappers/security-finding-mapper';
import {Observable} from 'rxjs';
import {OpenSourceHealthMapper} from '../mappers/open-source-health-mapper';

@Injectable({
  providedIn: 'root',
})
export class SigridData {
  private readonly _openSourceHealthFindings = signal<SigridFinding<OpenSourceHealthDependency[]> | null>(null);
  private readonly _securityFindings = signal<SigridFinding<SecurityFinding[]> | null>(null);
  private readonly sigridApi = inject(SigridApi);

  get securityFindings() {
    return this._securityFindings.asReadonly();
  }

  get openSourceHealthFindings() {
    return this._openSourceHealthFindings.asReadonly();
  }

  loadSecurityFindings(forceRefresh?: boolean) {
    // if (!forceRefresh && this.securityFindings()) {
    //   return;
    // }

    this.fetchFindings(() => this.sigridApi.getSecurityFindings(), this._securityFindings, SecurityFindingMapper.map, 'security');

    // this.sigridApi.getSecurityFindings().subscribe({
    //   next: result => {
    //     this._securityFindings.set({data: SecurityFindingMapper.map(result)} as SigridFinding<SecurityFinding[]>)
    //   },
    //   error: error => {
    //     console.error(error);
    //     this._securityFindings.set({error: 'Error occurred while fetching security findings.'} as SigridFinding<SecurityFinding[]>);
    //   }
    // });
  }

  loadOpenSourceHealthFindings(forceRefresh?: boolean) {
    this.fetchFindings(() => this.sigridApi.getOpenSourceHealthFindings(), this._openSourceHealthFindings, OpenSourceHealthMapper.map, 'open source health');
  }

  private fetchFindings<Response, Finding>(httpFn: () => Observable<Response>, findingSignal: WritableSignal<SigridFinding<Finding> | null>, mapperFn: (response: Response) => Finding, findingLabel: string, forceRefresh?: boolean) {
    if (!forceRefresh && findingSignal()) {
      return;
    }

    httpFn().subscribe({
      next: (data) => {
        try {
          const mappedData = mapperFn(data);
          findingSignal.set({data: mappedData} as SigridFinding<Finding>);
        } catch (mapperError) {
          console.error(`Error mapping response to ${findingLabel} findings:`, mapperError);
          findingSignal.set({error: `Error occurred while mapping response to ${findingLabel} findings.`} as SigridFinding<Finding>);
        }
      },
      error: (error) => {
        console.error(`Error occurred while fetching ${findingLabel} findings:`, error);
        findingSignal.set({error: `Error occurred while fetching ${findingLabel} findings.`} as SigridFinding<Finding>);
      }
    });
  }

}
