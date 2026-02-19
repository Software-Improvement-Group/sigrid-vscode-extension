import {Property} from './property';
import {RiskSeverity} from './risk-severity';
import {FileLocation} from './file-location';

export interface OpenSourceHealthResponse {
  bomFormat: string;
  specVersion: string;
  version: number;
  metadata: OshMetadataResponse;
  components: OshDependencyResponse[];
  vulnerabilities: any[];
}

export interface OshMetadataResponse {
  timestamp: string;
  properties: Property[];
}

export interface OshDependencyResponse {
  type: string;
  name: string;
  group: string;
  version: string;
  purl: string;
  properties: Property[];
  licenses: OshLicenseResponse[];
  evidence?: OshEvidenceResponse;
}

export interface OshLicenseResponse {
  license: {
    name: string;
  }
}

export interface OshEvidenceResponse {
  occurrences?: { location?: string }[];
}

export class OpenSourceHealthDependency {
  name: string = '';
  group: string = '';
  displayName: string = '';
  version: string = '';
  dependencyType: string = '';
  purl: string = '';
  risk: RiskSeverity = RiskSeverity.Unknown;
  licenseRisk: RiskSeverity = RiskSeverity.Unknown;
  vulnerabilityRisk: RiskSeverity = RiskSeverity.Unknown;
  freshnessRisk: RiskSeverity = RiskSeverity.Unknown;
  activityRisk: RiskSeverity = RiskSeverity.Unknown;
  stabilityRisk: RiskSeverity = RiskSeverity.Unknown;
  managementRisk: RiskSeverity = RiskSeverity.Unknown;
  fileLocations: FileLocation[] = [];
}
