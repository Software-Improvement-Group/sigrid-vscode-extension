import {describe, expect, it} from 'vitest';
import {sortFileLocations} from './sort-file-locations';
import type {FileLocation} from '../models/file-location';

describe('sortFileLocations', () => {
  it('sorts by file name (last path segment) ascending', () => {
    const input: FileLocation[] = [
      {filePath: '/repo/src/z.ts', startLine: 1, endLine: 1} as any,
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 1} as any,
      {filePath: '/repo/src/m.ts', startLine: 1, endLine: 1} as any,
    ];

    const result = sortFileLocations([...input]);

    expect(result.map((l) => l.filePath)).toEqual([
      '/repo/src/a.ts',
      '/repo/src/m.ts',
      '/repo/src/z.ts',
    ]);
  });

  it('when file names are equal, sorts by full path ascending', () => {
    const input: FileLocation[] = [
      {filePath: '/z/dir/same.ts', startLine: 1, endLine: 0} as any,
      {filePath: '/a/dir/same.ts', startLine: 999, endLine: 0} as any,
      {filePath: '/m/dir/same.ts', startLine: 0, endLine: 0} as any,
    ];

    const result = sortFileLocations([...input]);

    expect(result.map((l) => l.filePath)).toEqual([
      '/a/dir/same.ts',
      '/m/dir/same.ts',
      '/z/dir/same.ts',
    ]);
  });

  it('when file name and full path are equal, sorts by startLine (undefined treated as 0)', () => {
    const input: FileLocation[] = [
      {filePath: '/repo/src/a.ts', startLine: 10, endLine: 0} as any,
      {filePath: '/repo/src/a.ts', startLine: undefined, endLine: 0} as any,
      {filePath: '/repo/src/a.ts', startLine: 2, endLine: 0} as any,
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 0} as any,
    ];

    const result = sortFileLocations([...input]);

    expect(result.map((l) => l.startLine ?? 0)).toEqual([0, 1, 2, 10]);
  });

  it('mutates and returns the same array instance (in-place sort)', () => {
    const input: FileLocation[] = [
      {filePath: '/repo/src/b.ts', startLine: 1, endLine: 0} as any,
      {filePath: '/repo/src/a.ts', startLine: 1, endLine: 0} as any,
    ];

    const ref = input;
    const result = sortFileLocations(input);

    expect(result).toBe(ref);
    expect(result.map((l) => l.filePath)).toEqual(['/repo/src/a.ts', '/repo/src/b.ts']);
  });

  it('does not ignore directory when file names match: path tie-breaker can override startLine ordering', () => {
    const input: FileLocation[] = [
      // Same file name "same.ts"; path compare decides order before startLine
      {filePath: '/b/same.ts', startLine: 1, endLine: 0} as any,
      {filePath: '/a/same.ts', startLine: 150, endLine: 0} as any,
      {filePath: '/a/same.ts', startLine: 999, endLine: 0} as any,
    ];

    const result = sortFileLocations([...input]);

    expect(result.map((l) => ({filePath: l.filePath, startLine: l.startLine}))).toEqual([
      {filePath: '/a/same.ts', startLine: 150},
      {filePath: '/a/same.ts', startLine: 999},
      {filePath: '/b/same.ts', startLine: 1},
    ]);
  });
});
