import {Component, input} from '@angular/core';
import {RiskSeverity} from '../../models/risk-severity';

@Component({
  selector: 'sigrid-severity-icon',
  imports: [],
  templateUrl: './severity-icon.html',
  styleUrl: './severity-icon.scss',
})
export class SeverityIcon {
  severity = input(RiskSeverity.Unknown);
  protected readonly RiskSeverity = RiskSeverity;
}
