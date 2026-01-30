import {Component, inject} from '@angular/core';
import {OpenSourceHealthDependency} from '../models/open-source-health-dependency';
import {FindingComponent} from '../shared/finding-component';
import {SigridData} from '../services/sigrid-data';
import {SeverityIcon} from '../shared/severity-icon/severity-icon';
import {SeverityFilter} from '../shared/severity-filter/severity-filter';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [
    SeverityIcon,
    SeverityFilter
  ],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth extends FindingComponent<OpenSourceHealthDependency[]> {
  private sigridData!: SigridData;

  constructor() {
    const sigridData = inject(SigridData);
    super(sigridData.openSourceHealthFindings);
    this.sigridData = sigridData;
  }

  protected override loadData() {
    this.sigridData.loadOpenSourceHealthFindings();
  }
}
