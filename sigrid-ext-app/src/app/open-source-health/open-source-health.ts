import {Component, inject} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {FindingComponent} from '../shared/finding-component';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {FindingNavigator} from '../shared/finding-navigator';
import {ExternalLink} from '../shared/external-link/external-link';
import {FindingSelectionService} from '../services/finding-selection';
import {SelectedFinding} from '../models/selected-finding';
import {IconButton} from '../shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [
    SeverityIcon,
    FindingNavigator,
    ExternalLink,
    IconButton,
    TooltipDirective
  ],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth extends FindingComponent<OpenSourceHealthDependency[]> {
  private sigridData!: SigridData;
  protected selectionService = inject(FindingSelectionService);

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.openSourceHealthFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadOpenSourceHealthFindings();
  }

  protected toggleSelection(dependency: OpenSourceHealthDependency) {
    const selected: SelectedFinding = {
      id: dependency.purl,
      category: 'Open Source Health',
      title: `${dependency.displayName} ${dependency.version}`,
      severity: dependency.risk,
      fileLocations: dependency.fileLocations,
    };
    this.selectionService.toggle(selected);
  }
}
