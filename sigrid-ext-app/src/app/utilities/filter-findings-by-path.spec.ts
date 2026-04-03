import {describe, expect, it} from 'vitest';
import {filterFindingsByPath} from './filter-findings-by-path';
import type {SigridFinding} from '../models/sigrid-finding';
import type {FindingLocation} from '../models/finding-location';

describe('utilities/filter-findings-by-path', () => {
  it('returns null when sigridFindings is null', () => {
    expect(filterFindingsByPath(null, '/repo/src/a.ts')).toBeNull();
  });

  it('returns the original object when sigridFindings.data is undefined', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: undefined,
      error: undefined,
      date: undefined,
    };

    const result = filterFindingsByPath(input, '/repo/src/a.ts');

    expect(result).toBe(input);
  });

  it('returns a new result object that keeps date/error and has empty data when path is empty', () => {
    const date = new Date('2024-01-02T03:04:05.000Z');

    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {fileLocations: [{filePath: '/repo/src/a.ts'} as any]} as any,
        {fileLocations: [{filePath: '/repo/src/b.ts'} as any]} as any,
      ],
      error: 'some error',
      date,
    };

    const result = filterFindingsByPath(input, '');

    expect(result).not.toBe(input);
    expect(result).toEqual({
      data: [],
      error: 'some error',
      date,
    });

    // Ensure we didn't mutate the input
    expect(input.data?.length).toBe(2);
  });

  it('filters findings where any fileLocation.filePath exactly matches the given path', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {
          fileLocations: [{filePath: '/repo/src/a.ts'}, {filePath: '/repo/src/other.ts'}],
        } as any,
        {
          fileLocations: [{filePath: '/repo/src/b.ts'}],
        } as any,
        {
          fileLocations: [{filePath: '/repo/src/a.ts'}],
        } as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindingsByPath(input, '/repo/src/a.ts');

    expect(result).not.toBeNull();
    expect(result!.data?.length).toBe(2);
    expect(result!.data).toEqual([input.data![0], input.data![2]]);
  });

  it('does not mutate the original findings array and returns a different data array instance', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {fileLocations: [{filePath: '/repo/src/a.ts'}]} as any,
        {fileLocations: [{filePath: '/repo/src/b.ts'}]} as any,
      ],
      error: undefined,
      date: undefined,
    };

    const originalDataRef = input.data;

    const result = filterFindingsByPath(input, '/repo/src/a.ts');

    expect(input.data).toBe(originalDataRef);
    expect(result).not.toBeNull();
    expect(result!.data).not.toBe(originalDataRef);
    expect(input.data).toEqual([
      {fileLocations: [{filePath: '/repo/src/a.ts'}]},
      {fileLocations: [{filePath: '/repo/src/b.ts'}]},
    ]);
  });

  it('returns an empty data array when nothing matches', () => {
    const input: SigridFinding<FindingLocation[]> = {
      data: [
        {fileLocations: [{filePath: '/repo/src/a.ts'}]} as any,
        {fileLocations: [{filePath: '/repo/src/b.ts'}]} as any,
      ],
      error: undefined,
      date: undefined,
    };

    const result = filterFindingsByPath(input, '/repo/src/does-not-exist.ts');

    expect(result).not.toBeNull();
    expect(result!.data).toEqual([]);
  });
});
