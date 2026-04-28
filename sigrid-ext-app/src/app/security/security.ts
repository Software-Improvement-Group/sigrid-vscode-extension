import {Component, inject, OnInit} from '@angular/core';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {FindingComponent} from '../shared/finding-component';
import {SecurityFinding} from '../models/security-finding';
import {FindingNavigator} from '../shared/finding-navigator';
import {ExternalLink} from '../shared/external-link/external-link';
import {IconButton} from '../shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';
import {FindingEdit} from '../shared/finding-edit/finding-edit';
import {SigridDialog} from '../shared/dialog/sigrid-dialog';
import {FindingSelectionService, SelectedFinding} from '../services/finding-selection';

@Component({
  selector: 'app-security',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security extends FindingComponent<SecurityFinding[]> implements OnInit {
  private sigridData!: SigridData;
  private dialog = inject(SigridDialog);
  protected selectionService = inject(FindingSelectionService);

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.securityFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadSecurityFindings();
  }

  protected onStatusClick(finding: any) {
    const ref = this.dialog.open(FindingEdit, {finding: finding});
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.sigridData.loadSecurityFindings(true).then();
      }
    });
  }

  protected toggleSelection(finding: SecurityFinding) {
    const selected: SelectedFinding = {
      id: finding.id,
      category: 'Security',
      title: `${finding.displayFilePath}: ${finding.type}`,
      severity: finding.severity,
      fileLocations: finding.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
