import {RefactoringCategory} from './refactoring-category';
import {MaintainabilitySeverity} from './maintainability-severity';
import {FileLocation} from './file-location';

export interface RefactoringCandidatesResponse {
  refactoringCandidates: RefactoringCandidateResponse[];
}

export interface RefactoringCandidateResponse {
  id: string;
  severity: string;
  weight: number;
  status: string;
  technology: string;
  snapshotDate: string;
  sameComponent?: boolean;
  sameFile?: boolean;
  mcCabe?: number;
  fanIn?: number;
  loc?: number;
  parameters?: number;
  locations?: Location[],
  component?: string;
  file?: string;
  name?: string;
  moduleId?: number;
  startLine?: number;
  endLine?: number;
  lineRanges?: LineRange[]
}

export interface Location {
  component: string;
  file: string;
  moduleId: number;
  startLine: number;
  endLine: number;
}

export class RefactoringCandidate {
  id: string = '';
  category: RefactoringCategory = RefactoringCategory.Duplication;
  severity: MaintainabilitySeverity = MaintainabilitySeverity.Unknown;
  status: string = '';
  weight: number = 0;
  technology: string = '';
  snapshotDate: string = '';
  fileLocations: FileLocation[] = [];
  displayLocation: string = '';
  description: string = '';
  mcCabe?: number;
  fanIn?: number;
  component?: string;
  parameters?: number;
  name: string = '';
}

export interface LineRange {
  startLine: number;
  endLine: number;
}
