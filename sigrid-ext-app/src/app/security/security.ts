import {Component, inject, OnInit} from '@angular/core';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {FindingComponent} from '../shared/finding-component';
import {SecurityFinding} from '../models/security-finding';
import {FindingNavigator} from '../shared/finding-navigator';
import {ExternalLink} from '../shared/external-link/external-link';

@Component({
  selector: 'app-security',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security extends FindingComponent<SecurityFinding[]> implements OnInit {
  private sigridData!: SigridData;

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.securityFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadSecurityFindings();
  }

}
