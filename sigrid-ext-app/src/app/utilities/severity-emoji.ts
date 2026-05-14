const criticalSeverityEmoji = '\u{1F534}'; // 🔴
const mediumSeverityEmoji = '\u{1F7E0}';   // 🟠
const lowSeverityEmoji = '\u{1F7E1}';      // 🟡
const defaultSeverityEmoji = '\u26AA';     // ⚪️
const infoSeverityEmoji = '\u{1F535}';     // 🔵
const noneSeverityEmoji = '\u{1F7E2}';     // 🟢

const severityEmojiBySeverity: Record<string, string> = {
  critical: criticalSeverityEmoji,
  veryhigh: criticalSeverityEmoji,
  high: criticalSeverityEmoji,
  medium: mediumSeverityEmoji,
  moderate: mediumSeverityEmoji,
  low: lowSeverityEmoji,
  info: infoSeverityEmoji,
  information: infoSeverityEmoji,
  none: noneSeverityEmoji,
};

export function getSeverityEmoji(severity: string): string {
  let normalizedSeverity = severity.toString().toLowerCase();

  return severityEmojiBySeverity[normalizedSeverity] ?? defaultSeverityEmoji;
}
