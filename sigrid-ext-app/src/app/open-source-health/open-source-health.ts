import { Component } from '@angular/core';
import {SEVERITY_SYMBOLS} from '../severity-symbols';

@Component({
  selector: 'sigrid-open-source-health',
  imports: [],
  templateUrl: './open-source-health.html',
  styleUrl: './open-source-health.scss',
})
export class OpenSourceHealth {
  protected data = [
    {
      id: 'os-1',
      risk: SEVERITY_SYMBOLS['HIGH'],
      library: 'react-image-resizer',
      version: '1.4.5',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['NONE'],
      activity: SEVERITY_SYMBOLS['HIGH']
    },
    {
      id: 'os-2',
      risk: SEVERITY_SYMBOLS['HIGH'],
      library: 'some-lib-1',
      version: '1.3.2',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['HIGH'],
      activity: SEVERITY_SYMBOLS['MEDIUM']
    },
    {
      id: 'os-3',
      risk: SEVERITY_SYMBOLS['MEDIUM'],
      library: 'some-lib-2',
      version: '3.5.57',
      transitive: 'DIRECT',
      license: SEVERITY_SYMBOLS['NONE'],
      vulnerabilities: SEVERITY_SYMBOLS['NONE'],
      freshness: SEVERITY_SYMBOLS['NONE'],
      activity: SEVERITY_SYMBOLS['MEDIUM']
    }
  ]
}
