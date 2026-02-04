import {Component, inject} from '@angular/core';
import {FindingComponent} from '../shared/finding-component';
import {RefactoringCandidate} from '../models/refactoring-candidate';
import {SigridData} from '../services/sigrid-data';
import {MaintainabilitySeverityIcon} from './maintainability-severity-icon/maintainability-severity-icon.component';

@Component({
  selector: 'app-maintainability',
  imports: [
    MaintainabilitySeverityIcon
  ],
  templateUrl: './maintainability.html',
  styleUrl: './maintainability.scss',
})
export class Maintainability extends FindingComponent<RefactoringCandidate[]> {
  private sigridData!: SigridData;

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.refactoringCandidates);
    this.sigridData = sigridData;
  }

  protected override loadData(): void {
    this.sigridData.loadRefactoringCandidates()
  }

}
