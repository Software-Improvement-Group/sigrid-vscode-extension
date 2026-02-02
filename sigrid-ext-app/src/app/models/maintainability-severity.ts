export enum MaintainabilitySeverity {
  VeryHigh,
  High,
  Moderate,
  Medium,
  Low,
  Unknown
}

export function toMaintainabilitySeverity(severityStr: string): MaintainabilitySeverity {
  switch (severityStr.toLowerCase()) {
    case 'very_high':
      return MaintainabilitySeverity.VeryHigh;
    case 'high':
      return MaintainabilitySeverity.High;
    case 'moderate':
      return MaintainabilitySeverity.Moderate;
    case 'medium':
      return MaintainabilitySeverity.Medium;
    case 'low':
      return MaintainabilitySeverity.Low;
    default:
      return MaintainabilitySeverity.Unknown;
  }
}
