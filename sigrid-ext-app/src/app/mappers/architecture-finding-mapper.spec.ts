import {ArchitectureFindingMapper} from './architecture-finding-mapper';
import {ArchitectureDependencyResponse, ArchitectureGraphResponse} from '../models/architecture-finding';
import {RiskSeverity} from '../models/risk-severity';

describe('ArchitectureFindingMapper', () => {
  const graph = (...callDependencies: Partial<ArchitectureDependencyResponse>[]): ArchitectureGraphResponse => ({
    systemElements: [
      {id: 'comp-a', type: 'CODE_COMPONENT', name: 'a', shortName: 'a'},
      {id: 'comp-b', type: 'CODE_COMPONENT', name: 'b', shortName: 'b'},
      {id: 'file-a', type: 'FILE', name: 'a/src/a.ts', shortName: 'a.ts'},
      {id: 'file-b', type: 'FILE', name: 'b/src/b.ts', shortName: 'b.ts'},
      {id: 'orphan', type: 'FILE', name: 'orphan.ts', shortName: 'orphan.ts'},
    ],
    dependencies: [
      {type: 'CONTAINS', sourceElementId: 'comp-a', targetElementId: 'file-a'},
      {type: 'CONTAINS', sourceElementId: 'comp-b', targetElementId: 'file-b'},
      ...callDependencies.map(dependency => ({
        id: 'dep-1', type: 'CODE_CALL', sourceElementId: 'file-a', targetElementId: 'file-b', ...dependency,
      })),
    ],
  });

  it('returns [] for a response without elements or dependencies', () => {
    expect(ArchitectureFindingMapper.map({}, '')).toEqual([]);
    expect(ArchitectureFindingMapper.map(undefined as any, '')).toEqual([]);
  });

  it('maps an undesirable dependency to a high severity finding on the source file', () => {
    const [finding] = ArchitectureFindingMapper.map(graph({qualifications: ['UNDESIRABLE'], lines: [[12, 40]]}), '');

    expect(finding.id).toBe('dep-1');
    expect(finding.severity).toBe(RiskSeverity.High);
    expect(finding.description).toBe('Undesirable dependency from a to b.');
    expect(finding.filePath).toBe('a/src/a.ts');
    expect(finding.displayFilePath).toBe('.../a.ts');
    expect(finding.line).toBe(12);
    expect(finding.fileLocations).toEqual([{component: 'a', filePath: 'a/src/a.ts', startLine: 12, endLine: 12}]);
  });

  it('maps a cyclic dependency to a medium severity finding', () => {
    const [finding] = ArchitectureFindingMapper.map(graph({qualifications: ['CYCLIC']}), '');

    expect(finding.severity).toBe(RiskSeverity.Medium);
    expect(finding.description).toBe('Cyclic dependency between a and b.');
    expect(finding.line).toBe(0);
  });

  it('accepts the singular qualification field', () => {
    const findings = ArchitectureFindingMapper.map(graph({qualification: 'CYCLIC'}), '');

    expect(findings.length).toBe(1);
  });

  it('ignores unqualified, NEW, non-call and unparented dependencies', () => {
    const findings = ArchitectureFindingMapper.map(graph(
      {id: 'd1'},
      {id: 'd2', qualification: 'NEW'},
      {id: 'd3', type: 'DUPLICATION', qualifications: ['CYCLIC']},
      {id: 'd4', targetElementId: 'orphan', qualifications: ['CYCLIC']},
    ), '');

    expect(findings).toEqual([]);
  });

  it('keeps only findings whose source component is the configured subsystem', () => {
    const response = graph({qualifications: ['CYCLIC']});

    expect(ArchitectureFindingMapper.map(response, 'a').length).toBe(1);
    expect(ArchitectureFindingMapper.map(response, 'b')).toEqual([]);
  });

  it('strips the subsystem prefix from the file path', () => {
    const [finding] = ArchitectureFindingMapper.map(graph({qualifications: ['CYCLIC']}), 'a');

    expect(finding.filePath).toBe('src/a.ts');
  });

  it('sorts by severity, highest first', () => {
    const findings = ArchitectureFindingMapper.map(graph(
      {id: 'cyclic', qualifications: ['CYCLIC']},
      {id: 'undesirable', qualifications: ['UNDESIRABLE']},
    ), '');

    expect(findings.map(finding => finding.id)).toEqual(['undesirable', 'cyclic']);
  });
});
