import { asStringOrDefault, snakeCaseToTitleCase } from './string';

describe('utilities/string', () => {
  describe('snakeCaseToTitleCase', () => {
    it('converts snake_case to Title Case', () => {
      expect(snakeCaseToTitleCase('in_progress')).toBe('In Progress');
      expect(snakeCaseToTitleCase('VERY_HIGH')).toBe('Very High');
      expect(snakeCaseToTitleCase('alreadyTitle')).toBe('Alreadytitle');
    });

    it('handles multiple underscores and spacing', () => {
      expect(snakeCaseToTitleCase('a__b___c')).toBe('A  B   C');
    });

    it('returns empty string for empty input', () => {
      expect(snakeCaseToTitleCase('')).toBe('');
    });
  });

  describe('asStringOrDefault', () => {
    it('stringifies non-nullish values', () => {
      expect(asStringOrDefault(123)).toBe('123');
      expect(asStringOrDefault(false)).toBe('false');
      expect(asStringOrDefault('1.2.3')).toBe('1.2.3');
      expect(asStringOrDefault({ a: 1 })).toBe('[object Object]');
    });

    it('returns the default for null, undefined, and empty string', () => {
      expect(asStringOrDefault(null)).toBe('N/A');
      expect(asStringOrDefault(undefined)).toBe('N/A');
      expect(asStringOrDefault('')).toBe('N/A');

      expect(asStringOrDefault(null, 'DEFAULT')).toBe('DEFAULT');
      expect(asStringOrDefault(undefined, 'DEFAULT')).toBe('DEFAULT');
      expect(asStringOrDefault('', 'DEFAULT')).toBe('DEFAULT');
    });
  });
});
