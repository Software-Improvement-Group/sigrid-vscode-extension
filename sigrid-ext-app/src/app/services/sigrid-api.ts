import {inject, Injectable} from '@angular/core';
import {SigridApiTransport} from './sigrid-api-transport';
import {OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {SecurityFindingResponse} from '../models/security-finding';
import {RefactoringCategory} from '../models/refactoring-category';
import {RefactoringCandidatesResponse} from '../models/refactoring-candidate';
import {FindingRequest} from '../models/finding-request';

@Injectable({
  providedIn: 'root',
})
export class SigridApi {
  private transport = inject(SigridApiTransport);

  getOpenSourceHealthFindings() {
    return this.transport.request<OpenSourceHealthResponse>({method: 'GET', path: ['osh-findings']});
  }

  getSecurityFindings() {
    return this.transport.request<SecurityFindingResponse[]>({method: 'GET', path: ['security-findings']});
  }

  getRefactoringCandidates(category: RefactoringCategory) {
    return this.transport.request<RefactoringCandidatesResponse>({method: 'GET', path: ['refactoring-candidates', category]});
  }

  async getAllRefactoringCandidates() {
    const categories = Object.values(RefactoringCategory);
    const responses = await Promise.all(categories.map((category) => this.getRefactoringCandidates(category)));

    return Object.fromEntries(
      categories.map((category, i) => [category, responses[i]])
    ) as Record<string, RefactoringCandidatesResponse>;
  }

  editFinding(findingId: string, request: FindingRequest) {
    return this.transport.request<void>({method: 'PATCH', path: ['findings', findingId], body: request});
  }
}
