import {Component, computed, input} from '@angular/core';
import {RiskSeverity} from '../../models/risk-severity';
import {NgClass} from '@angular/common';

@Component({
  selector: 'sigrid-severity-icon',
  imports: [
    NgClass
  ],
  templateUrl: './severity-icon.html',
  styleUrl: './severity-icon.scss',
})
export class SeverityIcon {
  severity = input(RiskSeverity.Unknown);
  severityClass = computed(() => SEVERITY_TO_CSS_CLASS[this.severity()] ?? '');
}

const SEVERITY_TO_CSS_CLASS: Record<RiskSeverity, string> = {
  [RiskSeverity.None]: 'none',
  [RiskSeverity.Unknown]: '',
  [RiskSeverity.Information]: 'information',
  [RiskSeverity.Low]: 'low',
  [RiskSeverity.Medium]: 'medium',
  [RiskSeverity.High]: 'high',
  [RiskSeverity.Critical]: 'critical',
};
