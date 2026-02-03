import {
  RefactoringCandidate,
  RefactoringCandidateResponse,
  RefactoringCandidatesResponse,
} from "../models/refactoring-candidate";
import {RefactoringCategory} from '../models/refactoring-category';
import {snakeCaseToTitleCase} from '../utilities/string';
import {toMaintainabilitySeverity} from '../models/maintainability-severity';
import {toDisplayFilePath} from '../utilities/path';

export class RefactoringCandidateMapper {
  static map(response: Record<string, RefactoringCandidatesResponse>): RefactoringCandidate[] {
    const refactoringCandidates: RefactoringCandidate[] = [];

    for (const category of Object.values(RefactoringCategory)) {
      const candidateResponses = response[category];
      refactoringCandidates.push(...RefactoringCandidateMapper.mapRefactoringCandidate(category, candidateResponses));
    }

    return refactoringCandidates;
  }

  private static mapRefactoringCandidate(category: RefactoringCategory, candidateResponse: RefactoringCandidatesResponse): RefactoringCandidate[] {
    if (Array.isArray(candidateResponse.refactoringCandidates)) {
      return candidateResponse.refactoringCandidates.map(response => {
        const refactoringCandidate = new RefactoringCandidate();
        refactoringCandidate.id = response.id;
        refactoringCandidate.category = category;
        refactoringCandidate.severity = toMaintainabilitySeverity(response.severity);
        refactoringCandidate.weight = response.weight;
        refactoringCandidate.status = snakeCaseToTitleCase(response.status);
        refactoringCandidate.technology = response.technology;
        refactoringCandidate.snapshotDate = response.snapshotDate;
        refactoringCandidate.locations = response.locations;
        refactoringCandidate.lineRanges = response.lineRanges;
        refactoringCandidate.name = response.name ?? '';
        refactoringCandidate.mcCabe = response.mcCabe;
        refactoringCandidate.fanIn = response.fanIn;
        refactoringCandidate.component = response.component;
        refactoringCandidate.parameters = response.parameters;
        refactoringCandidate.displayLocation = RefactoringCandidateMapper.getDisplayLocation(response);
        refactoringCandidate.description = RefactoringCandidateMapper.getDescription(category, response);

        return refactoringCandidate;
      });
    }

    return [];
  }

  private static getDisplayLocation(response: RefactoringCandidateResponse): string {
    const locations = response.locations ?? [];

    if (locations.length === 0) {
      return toDisplayFilePath(response.file);
    }

    const first = toDisplayFilePath(locations[0]?.file);

    if (locations.length === 1) {
      return first;
    }

    const second = toDisplayFilePath(locations[1]?.file);

    if (locations.length === 2) {
      return `${first} and ${second}`;
    }

    return `${first}, ${second} and ${locations.length - 2} other files`;
  }

  private static getDescription(category: RefactoringCategory, response: RefactoringCandidateResponse) {
    switch (category) {
      case RefactoringCategory.Duplication:
        return `${response.weight} lines of code are duplicated between ${RefactoringCandidateMapper.getDisplayLocation(response)}.`;
      case RefactoringCategory.UnitSize:
        return `${response.name} contains ${response.weight} lines of code.`;
      case RefactoringCategory.UnitComplexity:
        return `${response.name} defines ${response.mcCabe} decision points.`;
      case RefactoringCategory.UnitInterfacing:
        return `${response.name} has ${response.parameters} parameters.`;
      case RefactoringCategory.ModuleCoupling:
        return `${toDisplayFilePath(response.file, '')} has ${response.fanIn} incoming dependencies from other units.`;
      // case RefactoringCategory.ComponentIndependence:
      //   return `${response.component} has ${response.fanOut} incoming dependencies from other components.`;
    }

    return '';
  }
}
