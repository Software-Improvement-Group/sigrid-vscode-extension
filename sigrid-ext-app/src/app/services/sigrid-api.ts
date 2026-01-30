import {computed, inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SigridConfiguration} from './sigrid-configuration';
import {SIGRID_API_BASE_URL} from '../utilities/constants';
import {joinUrl} from '../utilities/join-url';
import {OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {SecurityFindingResponse} from '../models/security-finding';

@Injectable({
  providedIn: 'root',
})
export class SigridApi {
  private http = inject(HttpClient);
  private sigridConfiguration = inject(SigridConfiguration);

  private configuration = computed(() => {
    return this.sigridConfiguration.getConfiguration()() ?? this.sigridConfiguration.getEmptyConfiguration();
  });

  getOpenSourceHealthFindings() {
    const configuration = this.configuration();
    return this.http.get<OpenSourceHealthResponse>(joinUrl(SIGRID_API_BASE_URL, 'osh-findings', configuration.customer, configuration.system));
  }

  getSecurityFindings() {
    const configuration = this.configuration();
    return this.http.get<SecurityFindingResponse[]>(joinUrl(SIGRID_API_BASE_URL, 'security-findings', configuration.customer, configuration.system));
  }
}
