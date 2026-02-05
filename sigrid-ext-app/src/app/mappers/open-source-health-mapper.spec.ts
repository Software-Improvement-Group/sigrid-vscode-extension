import { OpenSourceHealthMapper } from './open-source-health-mapper';
import { OpenSourceHealthResponse } from '../models/open-source-health-dependency';
import { RiskSeverity } from '../models/risk-severity';
import { Property } from '../models/property';

describe('OpenSourceHealthMapper', () => {
  const baseResponse = (overrides: Partial<OpenSourceHealthResponse> = {}): OpenSourceHealthResponse =>
    ({
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {
        timestamp: '2026-01-01T00:00:00Z',
        properties: [],
      },
      components: [],
      vulnerabilities: [],
      ...overrides,
    }) as OpenSourceHealthResponse;

  const props = (record: Record<string, string>): Property[] =>
    Object.entries(record).map(([name, value]) => ({ name, value }));

  it('returns [] when response.components is not an array', () => {
    const response = baseResponse({ components: undefined as any });

    expect(OpenSourceHealthMapper.map(response)).toEqual([]);
  });

  it('maps component fields, computes overall risk as max risk, and formats displayName + dependencyType', () => {
    const response = baseResponse({
      components: [
        {
          type: 'library',
          name: 'lib-a',
          group: 'acme',
          version: '1.2.3',
          purl: 'pkg:npm/acme/lib-a@1.2.3',
          properties: props({
            'sigrid:transitive': 'direct_dependency',
            'sigrid:risk:legal': 'low',
            'sigrid:risk:vulnerability': 'HIGH',
            'sigrid:risk:freshness': 'NONE',
            'sigrid:risk:activity': 'INFORMATION',
            'sigrid:risk:stability': 'MEDIUM',
            'sigrid:risk:management': 'UNKNOWN',
          }),
          licenses: [],
        },
      ],
    });

    const [dep] = OpenSourceHealthMapper.map(response);

    expect(dep.name).toBe('lib-a');
    expect(dep.group).toBe('acme');
    expect(dep.displayName).toBe('acme/lib-a');
    expect(dep.version).toBe('1.2.3');
    expect(dep.purl).toBe('pkg:npm/acme/lib-a@1.2.3');

    expect(dep.dependencyType).toBe('Direct Dependency');

    expect(dep.licenseRisk).toBe(RiskSeverity.Low);
    expect(dep.vulnerabilityRisk).toBe(RiskSeverity.High);
    expect(dep.freshnessRisk).toBe(RiskSeverity.None);
    expect(dep.activityRisk).toBe(RiskSeverity.Information);
    expect(dep.stabilityRisk).toBe(RiskSeverity.Medium);
    expect(dep.managementRisk).toBe(RiskSeverity.Unknown);

    expect(dep.risk).toBe(RiskSeverity.High);
  });

  it('uses component.name as displayName when group is empty and sorts by risk desc then displayName asc', () => {
    const response = baseResponse({
      components: [
        {
          type: 'library',
          name: 'bbb',
          group: '',
          version: '0.1.0',
          purl: 'pkg:npm/bbb@0.1.0',
          properties: props({
            'sigrid:transitive': 'transitive',
            'sigrid:risk:legal': 'medium',
            'sigrid:risk:vulnerability': 'low',
            'sigrid:risk:freshness': 'none',
            'sigrid:risk:activity': 'none',
            'sigrid:risk:stability': 'none',
            'sigrid:risk:management': 'none',
          }),
          licenses: [],
        },
        {
          type: 'library',
          name: 'aaa',
          group: '',
          version: '0.2.0',
          purl: 'pkg:npm/aaa@0.2.0',
          properties: props({
            'sigrid:transitive': 'transitive',
            'sigrid:risk:legal': 'medium',
            'sigrid:risk:vulnerability': 'low',
            'sigrid:risk:freshness': 'none',
            'sigrid:risk:activity': 'none',
            'sigrid:risk:stability': 'none',
            'sigrid:risk:management': 'none',
          }),
          licenses: [],
        },
        {
          type: 'library',
          name: 'zzz',
          group: '',
          version: '9.9.9',
          purl: 'pkg:npm/zzz@9.9.9',
          properties: props({
            'sigrid:transitive': 'direct',
            'sigrid:risk:legal': 'critical',
            'sigrid:risk:vulnerability': 'none',
            'sigrid:risk:freshness': 'none',
            'sigrid:risk:activity': 'none',
            'sigrid:risk:stability': 'none',
            'sigrid:risk:management': 'none',
          }),
          licenses: [],
        },
      ],
    });

    const result = OpenSourceHealthMapper.map(response);

    // Highest risk first
    expect(result[0].name).toBe('zzz');
    expect(result[0].risk).toBe(RiskSeverity.Critical);
    expect(result[0].displayName).toBe('zzz');

    // Same risk (Medium) sorted by displayName asc: aaa then bbb
    expect(result[1].risk).toBe(RiskSeverity.Medium);
    expect(result[2].risk).toBe(RiskSeverity.Medium);
    expect(result[1].displayName).toBe('aaa');
    expect(result[2].displayName).toBe('bbb');
  });
});
