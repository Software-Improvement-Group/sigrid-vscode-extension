import { toDisplayFilePath } from './path';

describe('utilities/path', () => {
  describe('toDisplayFilePath', () => {
    it('returns empty string for nullish or empty path', () => {
      expect(toDisplayFilePath(undefined)).toBe('');
      expect(toDisplayFilePath(null)).toBe('');
      expect(toDisplayFilePath('')).toBe('');
    });

    it('returns the last path segment with default prefix', () => {
      expect(toDisplayFilePath('/repo/src/app/file.ts')).toBe('.../file.ts');
      expect(toDisplayFilePath('file.ts')).toBe('.../file.ts');
      expect(toDisplayFilePath('a/b/c')).toBe('.../c');
    });

    it('supports a custom prefix', () => {
      expect(toDisplayFilePath('/repo/src/app/file.ts', '')).toBe('file.ts');
      expect(toDisplayFilePath('/repo/src/app/file.ts', 'FILE: ')).toBe('FILE: file.ts');
    });

    it('returns empty string when the last path segment is empty (trailing slash)', () => {
      expect(toDisplayFilePath('/repo/src/app/')).toBe('');
      expect(toDisplayFilePath('a/b/')).toBe('');
    });

    it('handles multiple consecutive slashes', () => {
      expect(toDisplayFilePath('a//b///c.ts')).toBe('.../c.ts');
    });
  });
});
