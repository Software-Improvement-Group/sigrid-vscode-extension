import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {SecurityFinding} from '../models/security-finding';
import {SigridApi} from './sigrid-api';
import {SigridFinding} from '../models/sigrid-finding';
import {SecurityFindingMapper} from '../mappers/security-finding-mapper';
import {Observable} from 'rxjs';
import {OpenSourceHealthMapper} from '../mappers/open-source-health-mapper';
import {RefactoringCandidateMapper} from '../mappers/refactoring-candidate-mapper';
import {RefactoringCandidate} from '../models/refactoring-candidate';
import {FileFilterMode} from '../models/file-filter-mode';
import {filterFindingsByPath} from '../utilities/filter-findings-by-path';
import {getFileName} from '../utilities/path';

@Injectable({
  providedIn: 'root',
})
export class SigridData {
  private readonly _refactoringCandidates = signal<SigridFinding<RefactoringCandidate[]> | null>(null);
  private readonly _openSourceHealthFindings = signal<SigridFinding<OpenSourceHealthDependency[]> | null>(null);
  private readonly _securityFindings = signal<SigridFinding<SecurityFinding[]> | null>(null);
  private readonly _fileFilter = signal<FileFilterMode>(FileFilterMode.All);
  private readonly _activeFilePath = signal<string | null | undefined>(undefined);
  private readonly sigridApi = inject(SigridApi);
  readonly displayActivePath = computed(() => this._fileFilter() === FileFilterMode.Active ? getFileName(this._activeFilePath()) : '');

  private filteredRefactoringCandidates = computed(() => {
    return this._fileFilter() === FileFilterMode.All
      ? this._refactoringCandidates()
      : filterFindingsByPath(this._refactoringCandidates(), this._activeFilePath() ?? '') as SigridFinding<RefactoringCandidate[]>;
  });

  private filteredSecurityFindings = computed(() => {
    return this._fileFilter() === FileFilterMode.All
      ? this._securityFindings()
      : filterFindingsByPath(this._securityFindings(), this._activeFilePath() ?? '') as SigridFinding<SecurityFinding[]>;
  });

  private filteredOpenSourceHealthFindings = computed(() => {
    return this._fileFilter() === FileFilterMode.All
      ? this._openSourceHealthFindings()
      : filterFindingsByPath(this._openSourceHealthFindings(), this._activeFilePath() ?? '') as SigridFinding<OpenSourceHealthDependency[]>;
  })

  get refactoringCandidates() {
    return this.filteredRefactoringCandidates;
  }

  get securityFindings() {
    return this.filteredSecurityFindings;
  }

  get openSourceHealthFindings() {
    return this.filteredOpenSourceHealthFindings;
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

  loadAllFindings() {
    this.loadRefactoringCandidates(true);
    this.loadSecurityFindings(true);
    this.loadOpenSourceHealthFindings(true);
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

  setFileFilter(fileFilter: FileFilterMode) {
    this._fileFilter.set(fileFilter);
  }

  setActiveFilePath(filePath: string) {
    this._activeFilePath.set(filePath);
  }

  get activeFilePath() {
    return this._activeFilePath;
  }
}
