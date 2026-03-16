export enum FindingStatus {
  Raw = 'RAW',
  Refined = 'REFINED',
  WillFix = 'WILL_FIX',
  Fixed = 'FIXED',
  Accepted = 'ACCEPTED',
  FalsePositive = 'FALSE_POSITIVE',
}

export enum MaintainabilityFindingStatus {
  Raw = 'RAW',
  WillFix = 'WILL_FIX',
  Accepted = 'ACCEPTED',
}

export const FindingStatusEmoji: Record<string, string> = {
  [FindingStatus.Raw]: '❓',
  [FindingStatus.Refined]: '🔍',
  [FindingStatus.WillFix]: '🔧',
  [FindingStatus.Fixed]: '✅',
  [FindingStatus.Accepted]: '😐',
  [FindingStatus.FalsePositive]: '🚫',
};
