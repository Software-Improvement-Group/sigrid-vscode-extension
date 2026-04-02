import {describe, expect, it} from 'vitest';
import {filterFindings} from './filter-findings';
import type {SigridFinding} from '../models/sigrid-finding';
import type {FindingLocation} from '../models/finding-location';
import {FileFilterMode} from '../models/file-filter-mode';

describe('utilities/filter-findings', () => {
  it('returns null when sigridFindings is null', () => {
    expect(
      filterFindings(null, {
        fileFilterMode: FileFilterMode.All,
        path: '',
        component: '',
      })
    ).toBeNull();
  });

  it('returns the original object when sigridFindings.data is undefined', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: undefined,
      error: undefined,
      date: undefined,
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.All,
      path: '',
      component: '',
    });

    expect(result).toBe(input);
  });

  it('returns the original object when mode is All and no component is set', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {fileLocations: [{filePath: '/repo/src/a.ts', component: 'comp'} as any]} as any,
      ],
      error: 'some error',
      date: new Date('2024-01-02T03:04:05.000Z'),
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.All,
      path: '',
      component: '',
    });

    expect(result).toBe(input);
  });

  it('filters by component when mode is All', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {
          fileLocations: [
            {filePath: '/repo/src/a.ts', component: 'target'},
            {filePath: '/repo/src/b.ts', component: 'other'},
          ],
        } as any,
        {
          fileLocations: [{filePath: '/repo/src/c.ts', component: 'other'}],
        } as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.All,
      path: '/repo/src/a.ts',
      component: 'target',
    });

    expect(result).not.toBeNull();
    expect(result!.data).toEqual([input.data![0]]);
  });

  it('filters by path when mode is Active and component is empty', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {
          fileLocations: [{filePath: '/repo/src/a.ts', component: 'one'}],
        } as any,
        {
          fileLocations: [{filePath: '/repo/src/b.ts', component: 'two'}],
        } as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.Active,
      path: '/repo/src/a.ts',
      component: '',
    });

    expect(result).not.toBeNull();
    expect(result!.data).toEqual([input.data![0]]);
  });

  it('filters by both path and component when mode is Active', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {
          fileLocations: [{filePath: '/repo/src/a.ts', component: 'match'}],
        } as any,
        {
          fileLocations: [{filePath: '/repo/src/a.ts', component: 'other'}],
        } as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.Active,
      path: '/repo/src/a.ts',
      component: 'match',
    });

    expect(result).not.toBeNull();
    expect(result!.data).toEqual([input.data![0]]);
  });

  it('returns an empty data array when nothing matches', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {fileLocations: [{filePath: '/repo/src/a.ts', component: 'one'}]} as any,
        {fileLocations: [{filePath: '/repo/src/b.ts', component: 'two'}]} as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindings(input, {
      fileFilterMode: FileFilterMode.Active,
      path: '/repo/src/does-not-exist.ts',
      component: 'missing',
    });

    expect(result).not.toBeNull();
    expect(result!.data).toEqual([]);
  });
});
