import {
  RefactoringCandidate,
  RefactoringCandidateResponse,
  RefactoringCandidatesResponse,
} from "../models/refactoring-candidate";
import {RefactoringCategory} from '../models/refactoring-category';
import {snakeCaseToTitleCase} from '../utilities/string';
import {toMaintainabilitySeverity} from '../models/maintainability-severity';
import {toDisplayFilePath} from '../utilities/path';
import {FileLocation} from '../models/file-location';

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
        refactoringCandidate.fileLocations = RefactoringCandidateMapper.getFileLocations(category, response);
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

  private static getDisplayLocation(response: RefactoringCandidateResponse, noPathPrefix: boolean = false): string {
    const locations = response.locations ?? [];
    const pathPrefix = noPathPrefix ? '' : '.../';

    if (locations.length === 0) {
      return toDisplayFilePath(response.file, pathPrefix);
    }

    const first = toDisplayFilePath(locations[0]?.file, pathPrefix);

    if (locations.length === 1) {
      return first;
    }

    const second = toDisplayFilePath(locations[1]?.file, pathPrefix);

    if (locations.length === 2) {
      return `${first} and ${second}`;
    }

    return `${first}, ${second} and ${locations.length - 2} other files`;
  }

  private static getDescription(category: RefactoringCategory, response: RefactoringCandidateResponse) {
    const name = response.name?.replaceAll(',', ', ');
    switch (category) {
      case RefactoringCategory.Duplication:
        return `${response.weight} lines of code are duplicated between ${RefactoringCandidateMapper.getDisplayLocation(response, true)}.`;
      case RefactoringCategory.UnitSize:
        return `${name} contains ${response.weight} lines of code.`;
      case RefactoringCategory.UnitComplexity:
        return `${name} defines ${response.mcCabe} decision points.`;
      case RefactoringCategory.UnitInterfacing:
        return `${name} has ${response.parameters} parameters.`;
      case RefactoringCategory.ModuleCoupling:
        return `${toDisplayFilePath(response.file, '')} has ${response.fanIn} incoming dependencies from other units.`;
    }

    return '';
  }

  private static getFileLocations(category: RefactoringCategory, response: RefactoringCandidateResponse): FileLocation[] {
    switch (category) {
      case RefactoringCategory.Duplication:
        return response.locations?.map(location => {
          return {filePath: location.file, startLine: location.startLine, endLine: location.endLine} as FileLocation
        }) ?? [];
      case RefactoringCategory.ModuleCoupling:
        return [{filePath: response.file, startLine: 0, endLine: response.loc ?? 0} as FileLocation];
      case RefactoringCategory.UnitSize:
      case RefactoringCategory.UnitComplexity:
      case RefactoringCategory.UnitInterfacing:
        return response.lineRanges?.map(range => {
          return {filePath: response.file, startLine: range.startLine, endLine: range.endLine} as FileLocation
        }) ?? [];
      default:
        return [];
    }
  }
}
