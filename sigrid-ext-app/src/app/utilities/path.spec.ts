import {getParentDirectory, toDisplayFilePath} from './path';

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

  describe('getParentDirectory', () => {
    it('returns empty string for nullish or empty path', () => {
      expect(getParentDirectory(undefined)).toBe('');
      expect(getParentDirectory(null)).toBe('');
      expect(getParentDirectory('')).toBe('');
    });

    it('returns empty string if there is no slash in the path', () => {
      expect(getParentDirectory('file')).toBe('');
      expect(getParentDirectory('anotherfile')).toBe('');
    });

    it('returns parent directory for valid paths', () => {
      expect(getParentDirectory('/repo/src/app/file.ts')).toBe('/repo/src/app');
      expect(getParentDirectory('/repo/src/app/')).toBe('/repo/src/app');
      expect(getParentDirectory('a/b/c')).toBe('a/b');
    });

    it('handles paths with multiple consecutive slashes', () => {
      expect(getParentDirectory('a//b///c')).toBe('a//b//');
    });

    it('returns empty string when only a single slash is provided', () => {
      expect(getParentDirectory('/')).toBe('');
    });
  });
});
