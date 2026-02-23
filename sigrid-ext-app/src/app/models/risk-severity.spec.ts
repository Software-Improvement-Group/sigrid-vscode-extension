import {describe, expect, it} from 'vitest';
import {RiskSeverity, toRiskSeverity} from './risk-severity';

describe('RiskSeverity', () => {
  describe('toRiskSeverity', () => {
    it('should return RiskSeverity.None for input "none"', () => {
      expect(toRiskSeverity('none')).toBe(RiskSeverity.None);
    });

    it('should return RiskSeverity.Information for input "information"', () => {
      expect(toRiskSeverity('information')).toBe(RiskSeverity.Information);
    });

    it('should return RiskSeverity.Information for input "info"', () => {
      expect(toRiskSeverity('info')).toBe(RiskSeverity.Information);
    });

    it('should return RiskSeverity.Low for input "low"', () => {
      expect(toRiskSeverity('low')).toBe(RiskSeverity.Low);
    });

    it('should return RiskSeverity.Medium for input "medium"', () => {
      expect(toRiskSeverity('medium')).toBe(RiskSeverity.Medium);
    });

    it('should return RiskSeverity.High for input "high"', () => {
      expect(toRiskSeverity('high')).toBe(RiskSeverity.High);
    });

    it('should return RiskSeverity.Critical for input "critical"', () => {
      expect(toRiskSeverity('critical')).toBe(RiskSeverity.Critical);
    });

    it('should return RiskSeverity.Unknown for undefined input', () => {
      expect(toRiskSeverity(undefined)).toBe(RiskSeverity.Unknown);
    });

    it('should return RiskSeverity.Unknown for null input', () => {
      expect(toRiskSeverity(null)).toBe(RiskSeverity.Unknown);
    });

    it('should return RiskSeverity.Unknown for unknown input', () => {
      expect(toRiskSeverity('unknown')).toBe(RiskSeverity.Unknown);
    });

    it('should handle case-insensitive inputs correctly (e.g., "LoW")', () => {
      expect(toRiskSeverity('LoW')).toBe(RiskSeverity.Low);
    });

    it('should treat an empty string as RiskSeverity.Unknown', () => {
      expect(toRiskSeverity('')).toBe(RiskSeverity.Unknown);
    });
  })
});
