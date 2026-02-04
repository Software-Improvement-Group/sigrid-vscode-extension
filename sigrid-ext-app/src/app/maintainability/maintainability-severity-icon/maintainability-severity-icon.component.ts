import {Component, input} from '@angular/core';
import {MaintainabilitySeverity} from '../../models/maintainability-severity';

@Component({
  selector: 'sigrid-maintainability-severity-icon',
  imports: [],
  templateUrl: './maintainability-severity-icon.component.html',
  styleUrl: './maintainability-severity-icon.component.scss',
})
export class MaintainabilitySeverityIcon {
  severity = input(MaintainabilitySeverity.Unknown);
  protected readonly MaintainabilitySeverity = MaintainabilitySeverity;
}
