import {effect, inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SigridConfiguration} from './sigrid-configuration';
import {Configuration} from '../models/configuration';
import {SIGRID_API_BASE_URL} from '../utilities/constants';
import {joinUrl} from '../utilities/join-url';
import {OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {SecurityFindingResponse} from '../models/security-finding';

@Injectable({
  providedIn: 'root',
})
export class SigridApi {
  private http = inject(HttpClient);
  private configuration: Configuration;

  constructor() {
    const sigridConfiguration = inject(SigridConfiguration);
    this.configuration = sigridConfiguration.getEmptyConfiguration();

    effect(() => {
      let configuration = sigridConfiguration.getConfiguration()();
      this.configuration = configuration ?? sigridConfiguration.getEmptyConfiguration();
    });
  }

  getOpenSourceHealthFindings() {
    return this.http.get<OpenSourceHealthResponse>(joinUrl(SIGRID_API_BASE_URL, 'osh-findings', this.configuration.customer, this.configuration.system));
  }

  getSecurityFindings() {
    return this.http.get<SecurityFindingResponse[]>(joinUrl(SIGRID_API_BASE_URL, 'security-findings', this.configuration.customer, this.configuration.system));
  }
}
