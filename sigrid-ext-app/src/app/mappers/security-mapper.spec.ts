import { SecurityFindingMapper } from './security-finding-mapper';
import { SecurityFindingResponse } from '../models/security-finding';
import { RiskSeverity } from '../models/risk-severity';

describe('SecurityFindingMapper', () => {
  const baseResponse = (overrides: Partial<SecurityFindingResponse> = {}): SecurityFindingResponse =>
    ({
      id: 'id-1',
      href: 'https://example.invalid/finding/1',
      firstSeenAnalysisDate: '2026-01-01',
      lastSeenAnalysisDate: '2026-01-02',
      firstSeenSnapshotDate: '2026-01-01',
      lastSeenSnapshotDate: '2026-01-02',
      filePath: '/repo/src/app/a.ts',
      startLine: 10,
      endLine: 20,
      component: 'comp',
      type: 'sql_injection',
      cweId: 'CWE-89',
      severity: 'high',
      impact: 'impact',
      exploitability: 'exploitability',
      severityScore: 9,
      impactScore: 9,
      exploitabilityScore: 9,
      status: 'in_progress',
      remark: 'remark',
      toolName: null,
      isManualFinding: false,
      isSeverityOverridden: false,
      weaknessIds: [],
      categories: [],
      ...overrides,
    }) as SecurityFindingResponse;

  it('maps fields and applies defaults/formatting', () => {
    const input = [
      baseResponse({
        id: 'x',
        severity: 'MEDIUM',
        status: 'FALSE_POSITIVE',
        filePath: null,
        startLine: undefined as any,
        endLine: undefined as any,
      }),
    ];

    const [mapped] = SecurityFindingMapper.map(input);

    expect(mapped.id).toBe('x');
    expect(mapped.href).toBe('https://example.invalid/finding/1');
    expect(mapped.severity).toBe(RiskSeverity.Medium);

    expect(mapped.filePath).toBe('');
    expect(mapped.displayFilePath).toBe('');

    expect(mapped.startLine).toBe(0);
    expect(mapped.endLine).toBe(0);

    expect(mapped.type).toBe('sql_injection');
    expect(mapped.status).toBe('False Positive');
  });

  it('sorts by severity descending', () => {
    const input = [
      baseResponse({ id: 'low', severity: 'low', filePath: '/repo/src/app/z.ts' }),
      baseResponse({ id: 'critical', severity: 'critical', filePath: '/repo/src/app/a.ts' }),
      baseResponse({ id: 'medium', severity: 'medium', filePath: '/repo/src/app/m.ts' }),
    ];

    const result = SecurityFindingMapper.map(input);

    expect(result.map((r) => r.id)).toEqual(['critical', 'medium', 'low']);
  });

  it('when severities are equal, uses the implemented tie-breaker (displayFilePath vs filePath)', () => {
    const input = [
      baseResponse({ id: 'b', severity: 'high', filePath: '/repo/src/app/b.ts' }),
      baseResponse({ id: 'a', severity: 'high', filePath: '/repo/src/app/a.ts' }),
    ];

    const result = SecurityFindingMapper.map(input);

    // With the current implementation this ends up ordering by displayFilePath.localeCompare(b.filePath)
    // For these inputs it deterministically places 'a' before 'b'.
    expect(result.map((r) => r.id)).toEqual(['a', 'b']);
  });
});
