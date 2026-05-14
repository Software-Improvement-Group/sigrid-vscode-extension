import {getSeverityEmoji} from './severity-emoji';

describe('utilities/severityEmoji', () => {
  it('returns a red emoji for critical, veryhigh and high string severities', () => {
    expect(getSeverityEmoji('critical')).toBe('🔴');
    expect(getSeverityEmoji('veryhigh')).toBe('🔴');
    expect(getSeverityEmoji('high')).toBe('🔴');
  });

  it('returns an orange emoji for medium and moderate string severities', () => {
    expect(getSeverityEmoji('medium')).toBe('🟠');
    expect(getSeverityEmoji('moderate')).toBe('🟠');
  });

  it('returns a yellow emoji for low string severity', () => {
    expect(getSeverityEmoji('low')).toBe('🟡');
  });

  it('returns a blue emoji for information severity', () => {
    expect(getSeverityEmoji('information')).toBe('🔵');
    expect(getSeverityEmoji('info')).toBe('🔵');
  });

  it('returns a green emoji for none severity', () => {
    expect(getSeverityEmoji('none')).toBe('🟢');
  })

  it('matches string severities case-insensitively', () => {
    expect(getSeverityEmoji('CRITICAL')).toBe('🔴');
    expect(getSeverityEmoji('High')).toBe('🔴');
    expect(getSeverityEmoji('MeDiUm')).toBe('🟠');
    expect(getSeverityEmoji('MODERATE')).toBe('🟠');
    expect(getSeverityEmoji('LOW')).toBe('🟡');
    expect(getSeverityEmoji('InforMation')).toBe('🔵')
  });

  it('returns the default emoji for unknown string severities', () => {
    expect(getSeverityEmoji('unknown')).toBe('⚪');
    expect(getSeverityEmoji('')).toBe('⚪');
  });
});
