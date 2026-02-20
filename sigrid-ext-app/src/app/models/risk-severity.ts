export enum RiskSeverity {
  None,
  Unknown,
  Information,
  Low,
  Medium,
  High,
  Critical
}

export function toRiskSeverity(severityStr: string | undefined | null): RiskSeverity {
  switch (severityStr?.toLowerCase() ?? '') {
    case 'none':
      return RiskSeverity.None;
    case 'information':
    case 'info':
      return RiskSeverity.Information;
    case 'low':
      return RiskSeverity.Low;
    case 'medium':
      return RiskSeverity.Medium;
    case 'high':
      return RiskSeverity.High;
    case 'critical':
      return RiskSeverity.Critical;
    default:
        return RiskSeverity.Unknown;
  }
}
