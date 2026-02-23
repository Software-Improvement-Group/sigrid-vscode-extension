import { RefactoringCandidateMapper } from './refactoring-candidate-mapper';
import { RefactoringCategory } from '../models/refactoring-category';
import {
  RefactoringCandidateResponse,
  RefactoringCandidatesResponse,
} from '../models/refactoring-candidate';

describe('RefactoringCandidateMapper', () => {
  const emptyResponse = (): RefactoringCandidatesResponse => ({ refactoringCandidates: [] });

  const baseRecord = (): Record<string, RefactoringCandidatesResponse> => ({
    [RefactoringCategory.Duplication]: emptyResponse(),
    [RefactoringCategory.UnitSize]: emptyResponse(),
    [RefactoringCategory.UnitComplexity]: emptyResponse(),
    [RefactoringCategory.UnitInterfacing]: emptyResponse(),
    [RefactoringCategory.ModuleCoupling]: emptyResponse(),
  });

  const baseCandidate = (overrides: Partial<RefactoringCandidateResponse> = {}): RefactoringCandidateResponse =>
    ({
      id: 'id-1',
      severity: 'high',
      weight: 10,
      status: 'in_progress',
      technology: 'typescript',
      snapshotDate: '2026-01-01',
      file: '/repo/src/app/a.ts',
      name: 'myFunction',
      mcCabe: 3,
      fanIn: 7,
      parameters: 2,
      ...overrides,
    }) as RefactoringCandidateResponse;

  it('maps displayLocation from response.file when locations are missing/empty', () => {
    const record = baseRecord();
    record[RefactoringCategory.UnitSize] = {
      refactoringCandidates: [baseCandidate({ id: 'no-locations', locations: undefined, file: '/x/y/z.ts' })],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'no-locations');

    expect(candidate.displayLocation).toBe('.../z.ts');
  });

  it('maps displayLocation from the only location when exactly one location is present', () => {
    const record = baseRecord();
    record[RefactoringCategory.UnitSize] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'one-location',
          locations: [
            { component: 'c', file: '/repo/src/app/only.ts', moduleId: 1, startLine: 1, endLine: 2 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'one-location');

    expect(candidate.displayLocation).toBe('.../only.ts');
  });

  it('maps displayLocation as "first and second" when exactly two locations are present', () => {
    const record = baseRecord();
    record[RefactoringCategory.UnitSize] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'two-locations',
          locations: [
            { component: 'c', file: '/repo/src/app/first.ts', moduleId: 1, startLine: 1, endLine: 2 },
            { component: 'c', file: '/repo/src/app/second.ts', moduleId: 1, startLine: 3, endLine: 4 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'two-locations');

    expect(candidate.displayLocation).toBe('.../first.ts and .../second.ts');
  });

  it('maps displayLocation as "first, second and N other files" when more than two locations are present', () => {
    const record = baseRecord();
    record[RefactoringCategory.UnitSize] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'many-locations',
          locations: [
            { component: 'c', file: '/repo/src/app/one.ts', moduleId: 1, startLine: 1, endLine: 2 },
            { component: 'c', file: '/repo/src/app/two.ts', moduleId: 1, startLine: 3, endLine: 4 },
            { component: 'c', file: '/repo/src/app/three.ts', moduleId: 1, startLine: 5, endLine: 6 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'many-locations');

    expect(candidate.displayLocation).toBe('.../one.ts, .../two.ts and 1 other files');
  });

  it('maps RefactoringCandidate.fileLocations for Duplication from response.locations (file + startLine + endLine)', () => {
    const record = baseRecord();
    record[RefactoringCategory.Duplication] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'dup-file-locations',
          locations: [
            { component: 'c', file: '/repo/src/app/a.ts', moduleId: 1, startLine: 11, endLine: 22 },
            { component: 'c', file: '/repo/src/app/b.ts', moduleId: 1, startLine: 33, endLine: 44 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'dup-file-locations');

    expect(candidate.fileLocations).toEqual([
      { filePath: '/repo/src/app/a.ts', startLine: 11, endLine: 22 },
      { filePath: '/repo/src/app/b.ts', startLine: 33, endLine: 44 },
    ]);
  });

  it('maps RefactoringCandidate.fileLocations for UnitComplexity from response.lineRanges (response.file + startLine + endLine)', () => {
    const record = baseRecord();
    record[RefactoringCategory.UnitComplexity] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'complexity-file-locations',
          file: '/repo/src/app/complex.ts',
          lineRanges: [
            { startLine: 5, endLine: 15 },
            { startLine: 20, endLine: 25 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'complexity-file-locations');

    expect(candidate.fileLocations).toEqual([
      { filePath: '/repo/src/app/complex.ts', startLine: 5, endLine: 15 },
      { filePath: '/repo/src/app/complex.ts', startLine: 20, endLine: 25 },
    ]);
  });

  it('maps RefactoringCandidate.fileLocations for ModuleCoupling as a single location with startLine=0 and endLine=response.loc (or 0)', () => {
    const record = baseRecord();
    record[RefactoringCategory.ModuleCoupling] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'coupling-file-locations',
          file: '/repo/src/app/coupled.ts',
          loc: 123,
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'coupling-file-locations');

    expect(candidate.fileLocations).toEqual([
      { filePath: '/repo/src/app/coupled.ts', startLine: 0, endLine: 123 },
    ]);
  });

  it('sets fileLocations to [] for categories that use locations/lineRanges when the source arrays are missing', () => {
    const record = baseRecord();
    record[RefactoringCategory.Duplication] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'dup-no-locations-array',
          locations: undefined,
        }),
      ],
    };
    record[RefactoringCategory.UnitSize] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'unit-size-no-lineRanges-array',
          file: '/repo/src/app/size.ts',
          lineRanges: undefined,
        }),
      ],
    };

    const all = RefactoringCandidateMapper.map(record);

    const dup = all.find((c) => c.id === 'dup-no-locations-array')!;
    const unitSize = all.find((c) => c.id === 'unit-size-no-lineRanges-array')!;

    expect(dup.fileLocations).toEqual([]);
    expect(unitSize.fileLocations).toEqual([]);
  });

  it('builds Duplication description without ".../" prefix in display-location part', () => {
    const record = baseRecord();
    record[RefactoringCategory.Duplication] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'dup-desc',
          weight: 42,
          locations: [
            { component: 'c', file: '/repo/src/app/a.ts', moduleId: 1, startLine: 1, endLine: 2 },
            { component: 'c', file: '/repo/src/app/b.ts', moduleId: 1, startLine: 3, endLine: 4 },
          ],
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'dup-desc');

    expect(candidate.description).toBe('42 lines of code are duplicated between a.ts and b.ts.');
  });

  it('builds ModuleCoupling description without ".../" prefix for the main file', () => {
    const record = baseRecord();
    record[RefactoringCategory.ModuleCoupling] = {
      refactoringCandidates: [
        baseCandidate({
          id: 'coupling-desc',
          file: '/repo/src/app/coupled.ts',
          fanIn: 9,
        }),
      ],
    };

    const [candidate] = RefactoringCandidateMapper.map(record).filter((c) => c.id === 'coupling-desc');

    expect(candidate.description).toBe('coupled.ts has 9 incoming dependencies from other units.');
  });
});
