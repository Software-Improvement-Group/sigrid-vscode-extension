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
}
