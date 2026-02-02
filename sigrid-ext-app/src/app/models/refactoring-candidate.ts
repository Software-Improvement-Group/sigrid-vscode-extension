import {RefactoringCategory} from './refactoring-category';
import {MaintainabilitySeverity} from './maintainability-severity';

export interface RefactoringCandidateResponse {
  refactoringCandidates: [
    {
      id: string;
      severity: string;
      status: string;
      technology: string;
      snapshotDate: string;
      sameComponent?: boolean;
      sameFile?: boolean;
      locations?: [
        {
          component: string;
          file: string;
          moduleId: number;
          startLine: number;
          endLine: number;
        }
      ],
      lineRanges?: [
        {
          refactoringCandidateId: string;
          startLine: number;
          endLine: number;
        }
      ]
    }
  ]
}

export class RefactoringCandidate {
  id: string = '';
  category: RefactoringCategory = RefactoringCategory.Duplication;
  severity: MaintainabilitySeverity = MaintainabilitySeverity.Unknown;
  status: string = '';
  technology: string = '';
  snapshotDate: string = '';
}
