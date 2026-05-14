export enum MaintainabilitySeverity {
  Unknown,
  Low,
  Medium,
  Moderate,
  High,
  VeryHigh
}

export const maintainabilitySeverityStringValues: Record<MaintainabilitySeverity, string> = {
  [MaintainabilitySeverity.Unknown]: 'unknown',
  [MaintainabilitySeverity.Low]: 'low',
  [MaintainabilitySeverity.Medium]: 'medium',
  [MaintainabilitySeverity.Moderate]: 'moderate',
  [MaintainabilitySeverity.High]: 'high',
  [MaintainabilitySeverity.VeryHigh]: 'veryhigh',
};

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
