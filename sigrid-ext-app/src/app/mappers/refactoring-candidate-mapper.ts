import {RefactoringCandidate, RefactoringCandidateResponse,} from "../models/refactoring-candidate";
import {RefactoringCategory} from '../models/refactoring-category';
import {snakeCaseToTitleCase} from '../utilities/string';
import {toMaintainabilitySeverity} from '../models/maintainability-severity';

export class RefactoringCandidateMapper {
  static map(response: Record<string, RefactoringCandidateResponse>): RefactoringCandidate[] {
    const refactoringCandidates: RefactoringCandidate[] = [];

    for (const category of Object.values(RefactoringCategory)) {
      const candidateResponses = response[category];
      refactoringCandidates.push(...this.mapRefactoringCandidate(category, candidateResponses));
    }

    return refactoringCandidates;
  }

  private static mapRefactoringCandidate(category: RefactoringCategory, candidateResponse: RefactoringCandidateResponse) {
    if (Array.isArray(candidateResponse.refactoringCandidates)) {
      return candidateResponse.refactoringCandidates.map(response => {
        const refactoringCandidate = new RefactoringCandidate();
        refactoringCandidate.id = response.id;
        refactoringCandidate.category = category;
        refactoringCandidate.severity = toMaintainabilitySeverity(response.severity);
        refactoringCandidate.status = snakeCaseToTitleCase(response.status);
        refactoringCandidate.technology = response.technology;
        refactoringCandidate.snapshotDate = response.snapshotDate;


        return refactoringCandidate;
      });
    }

    return [];
  }

  private static mapLocations() {

  }
}
