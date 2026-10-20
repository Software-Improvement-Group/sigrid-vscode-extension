import {Component, inject} from '@angular/core';
import {ArchitectureFinding} from '../models/architecture-finding';
import {FindingComponent} from '../shared/finding-component';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {FindingNavigator} from '../shared/finding-navigator';
import {SelectedFinding} from '../models/selected-finding';
import {FindingCategory} from '../models/finding-category';
import {ExternalLink} from '../shared/external-link/external-link';
import {IconButton} from '../shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';
import {RiskSeverity, riskSeverityStringValues} from '../models/risk-severity';
import {FilterableHeader} from '../shared/filterable-header/filterable-header';

@Component({
  selector: 'sigrid-architecture',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective,
    FilterableHeader
  ],
  templateUrl: './architecture.html',
  styleUrl: './architecture.scss',
})
export class Architecture extends FindingComponent<ArchitectureFinding[]> {
  protected readonly tabId = 'architecture';
  private sigridData!: SigridData;

  protected riskFilter = this.filterService.getColumnFilter('architecture', 'risk');

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.architectureFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadArchitectureFindings();
  }

  protected override matchesSearch(finding: ArchitectureFinding, term: string): boolean {
    return finding.description.toLowerCase().includes(term)
      || finding.filePath.toLowerCase().includes(term);
  }

  protected override matchesColumnFilters(finding: ArchitectureFinding): boolean {
    const risk = this.riskFilter();
    return !(risk.size > 0 && !risk.has(RiskSeverity[finding.severity]));
  }

  protected onRiskFilterChange(values: Set<string>) {
    this.filterService.setColumnFilter('architecture', 'risk', values);
  }

  protected override getRiskFilterValue(finding: ArchitectureFinding): string {
    return RiskSeverity[finding.severity];
  }

  protected override toSelectedFinding(finding: ArchitectureFinding): SelectedFinding {
    return {
      id: finding.id,
      category: FindingCategory.architecture,
      title: `${finding.displayFilePath}: ${finding.description}`,
      severity: riskSeverityStringValues[finding.severity],
      fileLocations: finding.fileLocations,
    };
  }
}
