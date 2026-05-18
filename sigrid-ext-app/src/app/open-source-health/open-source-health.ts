import {Component, inject} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {FindingComponent} from '../shared/finding-component';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {FindingNavigator} from '../shared/finding-navigator';
import {ExternalLink} from '../shared/external-link/external-link';
import {FindingSelection} from '../services/finding-selection';
import {SelectedFinding} from '../models/selected-finding';
import {IconButton} from '../shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';
import {RiskSeverity, riskSeverityStringValues} from '../models/risk-severity';
import {FilterableHeader} from '../shared/filterable-header/filterable-header';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective,
    FilterableHeader
  ],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth extends FindingComponent<OpenSourceHealthDependency[]> {
  protected readonly tabId = 'open-source-health';
  private sigridData!: SigridData;
  protected selectionService = inject(FindingSelection);

  protected riskFilter = this.filterService.getColumnFilter('open-source-health', 'risk');

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.openSourceHealthFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadOpenSourceHealthFindings();
  }

  protected override matchesSearch(finding: OpenSourceHealthDependency, term: string): boolean {
    return finding.displayName.toLowerCase().includes(term)
      || finding.version.toLowerCase().includes(term)
      || finding.dependencyType.toLowerCase().includes(term);
  }

  protected override matchesColumnFilters(finding: OpenSourceHealthDependency): boolean {
    const risk = this.riskFilter();
    return !(risk.size > 0 && !risk.has(RiskSeverity[finding.risk]));
  }

  protected onRiskFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('open-source-health', 'risk', values);
  }

  protected override getRiskFilterValue(finding: OpenSourceHealthDependency): string {
    return RiskSeverity[finding.risk];
  }

  protected toggleSelection(dependency: OpenSourceHealthDependency) {
    const selected: SelectedFinding = {
      id: dependency.purl,
      category: 'Open Source Health',
      title: `${dependency.displayName} ${dependency.version}`,
      severity: riskSeverityStringValues[dependency.risk],
      fileLocations: dependency.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
