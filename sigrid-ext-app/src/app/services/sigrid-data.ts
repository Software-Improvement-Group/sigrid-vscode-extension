import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {SecurityFinding} from '../models/security-finding';
import {SigridApi} from './sigrid-api';
import {SigridFinding} from '../models/sigrid-finding';
import {SecurityFindingMapper} from '../mappers/security-finding-mapper';
import {Observable} from 'rxjs';
import {OpenSourceHealthMapper} from '../mappers/open-source-health-mapper';
import {RefactoringCandidateMapper} from '../mappers/refactoring-candidate-mapper';
import {RefactoringCandidate} from '../models/refactoring-candidate';

@Injectable({
  providedIn: 'root',
})
export class SigridData {
  private readonly _refactoringCandidates = signal<SigridFinding<RefactoringCandidate[]> | null>(null);
  private readonly _openSourceHealthFindings = signal<SigridFinding<OpenSourceHealthDependency[]> | null>(null);
  private readonly _securityFindings = signal<SigridFinding<SecurityFinding[]> | null>(null);
  private readonly sigridApi = inject(SigridApi);

  get refactoringCandidates() {
    return this._refactoringCandidates.asReadonly();
  }

  get securityFindings() {
    return this._securityFindings.asReadonly();
  }

  get openSourceHealthFindings() {
    return this._openSourceHealthFindings.asReadonly();
  }

  loadRefactoringCandidates(forceRefresh?: boolean) {
    this.fetchFindings(() => this.sigridApi.getAllRefactoringCandidates(), this._refactoringCandidates, RefactoringCandidateMapper.map, 'refactoring candidates', forceRefresh);
  }

  loadSecurityFindings(forceRefresh?: boolean) {
    this.fetchFindings(() => this.sigridApi.getSecurityFindings(), this._securityFindings, SecurityFindingMapper.map, 'security', forceRefresh);
  }

  loadOpenSourceHealthFindings(forceRefresh?: boolean) {
    this.fetchFindings(() => this.sigridApi.getOpenSourceHealthFindings(), this._openSourceHealthFindings, OpenSourceHealthMapper.map, 'open source health', forceRefresh);
  }

  private fetchFindings<Response, Finding>(httpFn: () => Observable<Response>, findingSignal: WritableSignal<SigridFinding<Finding> | null>, mapperFn: (response: Response) => Finding, findingLabel: string, forceRefresh?: boolean) {
    if (!forceRefresh && findingSignal()) {
      return;
    }

    httpFn().subscribe({
      next: (data) => {
        try {
          console.log(data);
          const mappedData = mapperFn(data);
          console.log(mappedData);
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
