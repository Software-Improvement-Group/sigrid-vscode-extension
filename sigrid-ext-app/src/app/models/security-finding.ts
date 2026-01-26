import {RiskSeverity} from './risk-severity';

export interface SecurityFindingResponse {
  id: string;
  href: string;
  firstSeenAnalysisDate: string;
  lastSeenAnalysisDate: string;
  firstSeenSnapshotDate: string;
  lastSeenSnapshotDate: string;
  filePath: string | null | undefined;
  startLine: number;
  endLine: number;
  component: string;
  type: string;
  cweId: string
  severity: string;
  impact: string;
  exploitability: string;
  severityScore: number;
  impactScore: number;
  exploitabilityScore: number;
  status: string;
  remark: string;
  toolName: string | null | undefined;
  isManualFinding: boolean;
  isSeverityOverridden: boolean;
  weaknessIds: string[];
  categories: string[];
}

export class SecurityFinding {
  id: string = '';
  href: string = '';
  severity: RiskSeverity = RiskSeverity.Unknown;
}
