import {Component, computed, inject, OnInit} from '@angular/core';
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
import {FindingSelection} from '../services/finding-selection';
import {SelectedFinding} from '../models/selected-finding';
import {riskSeverityStringValues} from '../models/risk-severity';
import {FilterableHeader} from '../shared/filterable-header/filterable-header';
import {RiskSeverity} from '../models/risk-severity';
import {FindingStatus, FindingStatusEmoji} from '../models/finding-status';

@Component({
  selector: 'app-security',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective,
    FilterableHeader
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class Security extends FindingComponent<SecurityFinding[]> implements OnInit {
  protected readonly tabId = 'security';
  private sigridData!: SigridData;
  private dialog = inject(SigridDialog);
  protected selectionService = inject(FindingSelection);

  protected riskFilter = this.filterService.getColumnFilter('security', 'risk');
  protected statusFilter = this.filterService.getColumnFilter('security', 'status');
  protected locationFilter = this.filterService.getColumnFilter('security', 'location');

  protected riskOptions = computed(() => {
    const values = this.findings().map(f => RiskSeverity[f.severity]);
    return this.buildFilterOptions(values);
  });

  protected statusOptions = computed(() => {
    const values = this.findings().map(f => f.status);
    return this.buildFilterOptions(values);
  });

  protected locationOptions = computed(() => {
    const values = this.findings().map(f => f.displayFilePath);
    return this.buildFilterOptions(values);
  });

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.securityFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadSecurityFindings();
  }

  protected override matchesSearch(finding: SecurityFinding, term: string): boolean {
    return finding.displayFilePath.toLowerCase().includes(term)
      || finding.type.toLowerCase().includes(term)
      || finding.statusLabel.toLowerCase().includes(term);
  }

  protected override matchesColumnFilters(finding: SecurityFinding): boolean {
    const risk = this.riskFilter();
    if (risk.size > 0 && !risk.has(RiskSeverity[finding.severity])) return false;
    const status = this.statusFilter();
    if (status.size > 0 && !status.has(finding.status)) return false;
    const location = this.locationFilter();
    if (location.size > 0 && !location.has(finding.displayFilePath)) return false;
    return true;
  }

  protected onRiskFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('security', 'risk', values);
  }

  protected onStatusFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('security', 'status', values);
  }

  protected onLocationFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('security', 'location', values);
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
      severity: riskSeverityStringValues[finding.severity],
      fileLocations: finding.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
