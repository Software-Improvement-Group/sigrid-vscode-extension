import {Component, inject} from '@angular/core';
import {FindingComponent} from '../shared/finding-component';
import {RefactoringCandidate} from '../models/refactoring-candidate';
import {SigridData} from '../services/sigrid-data';
import {MaintainabilitySeverityIcon} from './maintainability-severity-icon/maintainability-severity-icon.component';
import {FindingNavigator} from '../shared/finding-navigator';
import {ExternalLink} from '../shared/external-link/external-link';
import {SigridDialog} from '../shared/dialog/sigrid-dialog';
import {FindingEdit} from '../shared/finding-edit/finding-edit';
import {IconButton} from '../shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';
import {FindingSelectionService, SelectedFinding} from '../services/finding-selection';

@Component({
  selector: 'app-maintainability',
  imports: [
    MaintainabilitySeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective
  ],
  templateUrl: './maintainability.html',
  styleUrl: './maintainability.scss',
})
export class Maintainability extends FindingComponent<RefactoringCandidate[]> {
  private sigridData!: SigridData;
  private dialog = inject(SigridDialog);
  protected selectionService = inject(FindingSelectionService);

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.refactoringCandidates);
    this.sigridData = sigridData;
  }

  protected override loadData(): void {
    this.sigridData.loadRefactoringCandidates()
  }

  protected onStatusClick(finding: RefactoringCandidate) {
    const ref = this.dialog.open(FindingEdit, {finding: finding});
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.sigridData.loadRefactoringCandidates(true).then();
      }
    });
  }

  protected toggleSelection(finding: RefactoringCandidate) {
    const selected: SelectedFinding = {
      id: finding.id,
      category: 'Maintainability',
      title: `${finding.displayLocation}: ${finding.description}`,
      severity: finding.severity,
      fileLocations: finding.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
