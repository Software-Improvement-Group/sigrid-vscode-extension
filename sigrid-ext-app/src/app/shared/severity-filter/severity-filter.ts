import { Component } from '@angular/core';
import {RiskSeverity} from '../../models/risk-severity';
import {SeverityIcon} from '../severity-icon/severity-icon';

@Component({
  selector: 'sigrid-severity-filter',
  imports: [
    SeverityIcon
  ],
  templateUrl: './severity-filter.html',
  styleUrl: './severity-filter.scss',
})
export class SeverityFilter {
  protected severities = Object.keys(RiskSeverity).filter(key => isNaN(Number(key))).reverse().map(key => {return {
    key: key, value: (<any> RiskSeverity)[key] as RiskSeverity
  }})
  protected readonly RiskSeverity = RiskSeverity;

  ngOnInit() {
    console.log();
  }
}
