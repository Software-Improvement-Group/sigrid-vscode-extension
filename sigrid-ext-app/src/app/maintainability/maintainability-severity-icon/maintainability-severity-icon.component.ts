import {Component, computed, input} from '@angular/core';
import {MaintainabilitySeverity} from '../../models/maintainability-severity';
import {NgClass} from '@angular/common';

@Component({
  selector: 'sigrid-maintainability-severity-icon',
  imports: [
    NgClass
  ],
  templateUrl: './maintainability-severity-icon.component.html',
  styleUrl: './maintainability-severity-icon.component.scss',
})
export class MaintainabilitySeverityIcon {
  severity = input(MaintainabilitySeverity.Unknown);
  severityClass = computed(() => SEVERITY_TO_CSS_CLASS[this.severity()] ?? '');
}

const SEVERITY_TO_CSS_CLASS: Record<MaintainabilitySeverity, string> = {
  [MaintainabilitySeverity.Unknown]: '',
  [MaintainabilitySeverity.Low]: 'low',
  [MaintainabilitySeverity.Moderate]: 'medium',
  [MaintainabilitySeverity.Medium]: 'medium',
  [MaintainabilitySeverity.High]: 'high',
  [MaintainabilitySeverity.VeryHigh]: 'critical',
};
