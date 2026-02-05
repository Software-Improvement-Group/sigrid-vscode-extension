import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { SigridData } from './sigrid-data';
import { SigridApi } from './sigrid-api';
import { SigridConfiguration } from './sigrid-configuration';

import { SIGRID_API_BASE_URL } from '../utilities/constants';
import { joinUrl } from '../utilities/join-url';
import { RefactoringCategory } from '../models/refactoring-category';

import { SecurityFindingMapper } from '../mappers/security-finding-mapper';
import { OpenSourceHealthMapper } from '../mappers/open-source-health-mapper';
import { RefactoringCandidateMapper } from '../mappers/refactoring-candidate-mapper';

import { SecurityFindingResponse } from '../models/security-finding';
import { OpenSourceHealthResponse } from '../models/open-source-health-dependency';
import { RefactoringCandidatesResponse } from '../models/refactoring-candidate';

describe('SigridData', () => {
  let service: SigridData;
  let httpMock: HttpTestingController;

  class SigridConfigurationStub {
    private readonly configSig = signal<{ apiKey: string; customer: string; system: string } | null>({
      apiKey: 'placeholder-api-key',
      customer: 'cust',
      system: 'sys',
    });

    getConfiguration() {
      return this.configSig.asReadonly();
    }

    setConfiguration(config: { apiKey: string; customer: string; system: string }) {
      this.configSig.set(config);
    }

    getEmptyConfiguration() {
      return { apiKey: '', customer: '', system: '' };
    }
  }

  const findingEndpoint = (...paths: string[]) =>
    joinUrl(SIGRID_API_BASE_URL, ...paths, 'cust', 'sys');

  const refactoringEndpoint = (category: RefactoringCategory) =>
    joinUrl(SIGRID_API_BASE_URL, 'refactoring-candidates', 'cust', 'sys', category);

  beforeEach(() => {
    vi.restoreAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SigridApi,
        SigridData,
        { provide: SigridConfiguration, useClass: SigridConfigurationStub },
      ],
    });

    service = TestBed.inject(SigridData);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    //vi.resetModules();
    // vi.resetAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadSecurityFindings() fetches via API, maps, and stores data', () => {
    const mapped = [{ id: 'mapped-security' }] as any;
    const mapperSpy = vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue(mapped);

    service.loadSecurityFindings();

    const req = httpMock.expectOne(findingEndpoint('security-findings'));
    expect(req.request.method).toBe('GET');

    const apiPayload: SecurityFindingResponse[] = [
      {
        id: 'f-1',
        href: 'https://example.invalid/f/1',
        firstSeenAnalysisDate: '2026-01-01',
        lastSeenAnalysisDate: '2026-01-02',
        firstSeenSnapshotDate: '2026-01-01',
        lastSeenSnapshotDate: '2026-01-02',
        filePath: '/repo/a.ts',
        startLine: 1,
        endLine: 2,
        component: 'c',
        type: 'x',
        cweId: 'CWE-0',
        severity: 'high',
        impact: 'i',
        exploitability: 'e',
        severityScore: 1,
        impactScore: 1,
        exploitabilityScore: 1,
        status: 'in_progress',
        remark: '',
        toolName: null,
        isManualFinding: false,
        isSeverityOverridden: false,
        weaknessIds: [],
        categories: [],
      },
    ];
    req.flush(apiPayload);

    expect(mapperSpy).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith(apiPayload);

    const finding = service.securityFindings()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('loadOpenSourceHealthFindings() fetches via API, maps, and stores data', () => {
    const mapped = [{ name: 'mapped-osh' }] as any;
    const mapperSpy = vi.spyOn(OpenSourceHealthMapper, 'map').mockReturnValue(mapped);

    service.loadOpenSourceHealthFindings();

    const req = httpMock.expectOne(findingEndpoint('osh-findings'));
    expect(req.request.method).toBe('GET');

    const apiPayload: OpenSourceHealthResponse = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: { timestamp: '2026-01-01T00:00:00Z', properties: [] },
      components: [],
      vulnerabilities: [],
    };
    req.flush(apiPayload);

    expect(mapperSpy).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith(apiPayload);

    const finding = service.openSourceHealthFindings()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('loadRefactoringCandidates() fetches all categories via API, maps, and stores data', () => {
    const mapped = [{ id: 'mapped-rc' }] as any;
    const mapperSpy = vi.spyOn(RefactoringCandidateMapper, 'map').mockReturnValue(mapped);

    service.loadRefactoringCandidates();

    const categories = Object.values(RefactoringCategory);

    for (const category of categories) {
      const req = httpMock.expectOne(refactoringEndpoint(category));
      expect(req.request.method).toBe('GET');
      req.flush({ refactoringCandidates: [] } satisfies RefactoringCandidatesResponse);
    }

    expect(mapperSpy).toHaveBeenCalledTimes(1);

    const aggregatedArg = mapperSpy.mock.calls[0][0] as Record<string, RefactoringCandidatesResponse>;
    for (const category of categories) {
      expect(aggregatedArg[category]).toEqual({ refactoringCandidates: [] });
    }

    const finding = service.refactoringCandidates()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('does not refetch when data already exists and forceRefresh is not set', () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue([] as any);

    service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);

    service.loadSecurityFindings(); // ignored
    httpMock.expectNone(findingEndpoint('security-findings'));
  });

  it('refetches when forceRefresh is true', () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue([] as any);

    service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);

    service.loadSecurityFindings(true);
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
  });

  it('stores a fetch error when the HTTP request fails', () => {
    service.loadSecurityFindings();

    const req = httpMock.expectOne(findingEndpoint('security-findings'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    const finding = service.securityFindings()!;
    expect(finding.data).toBeUndefined();
    expect(finding.error).toBe('Error occurred while fetching security findings.');
  });

  it('stores a mapping error when the mapper throws', () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockImplementation(() => {
      throw new Error('mapper boom');
    });

    service.loadSecurityFindings();

    const req = httpMock.expectOne(findingEndpoint('security-findings'));
    req.flush([] as SecurityFindingResponse[]);

    const finding = service.securityFindings()!;
    expect(finding.data).toBeUndefined();
    expect(finding.error).toBe('Error occurred while mapping response to security findings.');
  });
});
