import {describe, expect, it} from 'vitest';
import {MaintainabilitySeverity, toMaintainabilitySeverity} from './maintainability-severity';

describe('maintainability-severity', () => {
  it('defines enum values in expected order (numeric)', () => {
    expect(MaintainabilitySeverity.Unknown).toBe(0);
    expect(MaintainabilitySeverity.Low).toBe(1);
    expect(MaintainabilitySeverity.Medium).toBe(2);
    expect(MaintainabilitySeverity.Moderate).toBe(3);
    expect(MaintainabilitySeverity.High).toBe(4);
    expect(MaintainabilitySeverity.VeryHigh).toBe(5);
  });

  it('maps known severity strings (case-insensitive)', () => {
    expect(toMaintainabilitySeverity('very_high')).toBe(MaintainabilitySeverity.VeryHigh);
    expect(toMaintainabilitySeverity('VERY_HIGH')).toBe(MaintainabilitySeverity.VeryHigh);

    expect(toMaintainabilitySeverity('high')).toBe(MaintainabilitySeverity.High);
    expect(toMaintainabilitySeverity('HIGH')).toBe(MaintainabilitySeverity.High);

    expect(toMaintainabilitySeverity('moderate')).toBe(MaintainabilitySeverity.Moderate);
    expect(toMaintainabilitySeverity('MODERATE')).toBe(MaintainabilitySeverity.Moderate);

    expect(toMaintainabilitySeverity('medium')).toBe(MaintainabilitySeverity.Medium);
    expect(toMaintainabilitySeverity('MEDIUM')).toBe(MaintainabilitySeverity.Medium);

    expect(toMaintainabilitySeverity('low')).toBe(MaintainabilitySeverity.Low);
    expect(toMaintainabilitySeverity('LOW')).toBe(MaintainabilitySeverity.Low);
  });

  it('maps unknown values to Unknown', () => {
    expect(toMaintainabilitySeverity('unknown')).toBe(MaintainabilitySeverity.Unknown);
    expect(toMaintainabilitySeverity('')).toBe(MaintainabilitySeverity.Unknown);
    expect(toMaintainabilitySeverity('something_else')).toBe(MaintainabilitySeverity.Unknown);
  });

  it('treats whitespace as part of the value (no trimming) and returns Unknown', () => {
    expect(toMaintainabilitySeverity(' high ')).toBe(MaintainabilitySeverity.Unknown);
    expect(toMaintainabilitySeverity('\nlow\t')).toBe(MaintainabilitySeverity.Unknown);
  });

  it('throws if severityStr is null/undefined at runtime (document current behavior)', () => {
    expect(() => toMaintainabilitySeverity(undefined as any)).toThrow();
    expect(() => toMaintainabilitySeverity(null as any)).toThrow();
  });
});
