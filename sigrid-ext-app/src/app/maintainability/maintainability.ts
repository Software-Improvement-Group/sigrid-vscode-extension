import {Component, computed, inject} from '@angular/core';
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
import {FindingSelection} from '../services/finding-selection';
import {SelectedFinding} from '../models/selected-finding';
import {maintainabilitySeverityStringValues} from '../models/maintainability-severity';
import {FilterableHeader} from '../shared/filterable-header/filterable-header';
import {MaintainabilitySeverity} from '../models/maintainability-severity';

@Component({
  selector: 'app-maintainability',
  imports: [
    MaintainabilitySeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective,
    FilterableHeader
  ],
  templateUrl: './maintainability.html',
  styleUrl: './maintainability.scss',
})
export class Maintainability extends FindingComponent<RefactoringCandidate[]> {
  protected readonly tabId = 'maintainability';
  private sigridData!: SigridData;
  private dialog = inject(SigridDialog);
  protected selectionService = inject(FindingSelection);

  protected riskFilter = this.filterService.getColumnFilter('maintainability', 'risk');
  protected statusFilter = this.filterService.getColumnFilter('maintainability', 'status');
  protected locationFilter = this.filterService.getColumnFilter('maintainability', 'location');

  protected riskOptions = computed(() => {
    const values = this.findings().map(f => MaintainabilitySeverity[f.severity]);
    return this.buildFilterOptions(values);
  });

  protected statusOptions = computed(() => {
    const values = this.findings().map(f => f.status);
    return this.buildFilterOptions(values);
  });

  protected locationOptions = computed(() => {
    const values = this.findings().map(f => f.displayLocation);
    return this.buildFilterOptions(values);
  });

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.refactoringCandidates);
    this.sigridData = sigridData;
  }

  protected override loadData(): void {
    this.sigridData.loadRefactoringCandidates()
  }

  protected override matchesSearch(finding: RefactoringCandidate, term: string): boolean {
    return finding.displayLocation.toLowerCase().includes(term)
      || finding.description.toLowerCase().includes(term)
      || finding.statusLabel.toLowerCase().includes(term);
  }

  protected override matchesColumnFilters(finding: RefactoringCandidate): boolean {
    const risk = this.riskFilter();
    if (risk.size > 0 && !risk.has(MaintainabilitySeverity[finding.severity])) return false;
    const status = this.statusFilter();
    if (status.size > 0 && !status.has(finding.status)) return false;
    const location = this.locationFilter();
    if (location.size > 0 && !location.has(finding.displayLocation)) return false;
    return true;
  }

  protected onRiskFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('maintainability', 'risk', values);
  }

  protected onStatusFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('maintainability', 'status', values);
  }

  protected onLocationFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('maintainability', 'location', values);
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
      severity: maintainabilitySeverityStringValues[finding.severity],
      fileLocations: finding.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
