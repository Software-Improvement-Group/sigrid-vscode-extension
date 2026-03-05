import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {SigridData} from './sigrid-data';
import {SigridApi} from './sigrid-api';
import {SigridConfiguration} from './sigrid-configuration';

import {SIGRID_API_BASE_RELATIVE_URL, SIGRID_DEFAULT_URL} from '../utilities/constants';
import {joinUrl} from '../utilities/join-url';
import {RefactoringCategory} from '../models/refactoring-category';

import {SecurityFindingMapper} from '../mappers/security-finding-mapper';
import {OpenSourceHealthMapper} from '../mappers/open-source-health-mapper';
import {RefactoringCandidateMapper} from '../mappers/refactoring-candidate-mapper';

import {SecurityFindingResponse} from '../models/security-finding';
import {OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {RefactoringCandidatesResponse} from '../models/refactoring-candidate';
import {FileFilterMode} from '../models/file-filter-mode';

describe('SigridData', () => {
  let service: SigridData;
  let httpMock: HttpTestingController;

  class SigridConfigurationStub {
    private readonly configSig = signal<{
      apiKey: string;
      customer: string;
      system: string;
      sigridUrl?: string;
    } | null>({
      apiKey: 'placeholder-api-key',
      customer: 'cust',
      system: 'sys',
      // sigridUrl intentionally omitted to exercise SIGRID_DEFAULT_URL fallback
    });

    getConfiguration() {
      return this.configSig.asReadonly();
    }

    setConfiguration(config: { apiKey: string; customer: string; system: string; sigridUrl?: string }) {
      this.configSig.set(config);
    }

    getEmptyConfiguration() {
      return { apiKey: '', customer: '', system: '', sigridUrl: SIGRID_DEFAULT_URL };
    }

    getSigridApiBaseUrl(): string {
      const configuration = this.configSig() ?? this.getEmptyConfiguration();
      const base = !!configuration.sigridUrl ? configuration.sigridUrl : SIGRID_DEFAULT_URL;
      return joinUrl(base, SIGRID_API_BASE_RELATIVE_URL);
    }
  }

  const findingEndpoint = (...paths: string[]) =>
    joinUrl(SIGRID_DEFAULT_URL, SIGRID_API_BASE_RELATIVE_URL, ...paths, 'cust', 'sys');

  const refactoringEndpoint = (category: RefactoringCategory) =>
    joinUrl(SIGRID_DEFAULT_URL, SIGRID_API_BASE_RELATIVE_URL, 'refactoring-candidates', 'cust', 'sys', category);

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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('filteredSecurityFindings: returns unfiltered findings when FileFilterMode.All', async () => {
    const mapped = [
      {id: 'a', fileLocations: [{filePath: '/repo/a.ts'}]} as any,
      {id: 'b', fileLocations: [{filePath: '/repo/b.ts'}]} as any,
    ];
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue(mapped as any);

    service.setActiveFilePath('/repo/a.ts');
    service.setFileFilter(FileFilterMode.All);

    const p = service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await p;

    const finding = service.securityFindings()!;
    expect(finding.data).toBe(mapped as any);
    expect(finding.data).toHaveLength(2);
  });

  it('filteredSecurityFindings: filters by activeFilePath when FileFilterMode.Active', async () => {
    const mapped = [
      {id: 'match-1', fileLocations: [{filePath: '/repo/a.ts'}]} as any,
      {id: 'nope', fileLocations: [{filePath: '/repo/b.ts'}]} as any,
      {id: 'match-2', fileLocations: [{filePath: '/repo/a.ts'}, {filePath: '/repo/c.ts'}]} as any,
    ];
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue(mapped as any);

    service.setActiveFilePath('/repo/a.ts');
    service.setFileFilter(FileFilterMode.Active);

    const p = service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await p;

    const finding = service.securityFindings()!;
    expect(finding.data?.map((x: any) => x.id)).toEqual(['match-1', 'match-2']);
  });

  it('filteredOpenSourceHealthFindings: filters by activeFilePath when FileFilterMode.Active', async () => {
    const mapped = [
      {name: 'dep-a', fileLocations: [{filePath: '/repo/a.ts'}]} as any,
      {name: 'dep-b', fileLocations: [{filePath: '/repo/b.ts'}]} as any,
    ];
    vi.spyOn(OpenSourceHealthMapper, 'map').mockReturnValue(mapped as any);

    service.setActiveFilePath('/repo/b.ts');
    service.setFileFilter(FileFilterMode.Active);

    const p = service.loadOpenSourceHealthFindings();
    httpMock.expectOne(findingEndpoint('osh-findings')).flush({
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {timestamp: '2026-01-01T00:00:00Z', properties: []},
      components: [],
      vulnerabilities: [],
    } satisfies OpenSourceHealthResponse);
    await p;

    const finding = service.openSourceHealthFindings()!;
    expect(finding.data?.map((x: any) => x.name)).toEqual(['dep-b']);
  });

  it('filteredRefactoringCandidates: filters by activeFilePath when FileFilterMode.Active', async () => {
    const mapped = [
      {id: 'rc-1', fileLocations: [{filePath: '/repo/a.ts'}]} as any,
      {id: 'rc-2', fileLocations: [{filePath: '/repo/a.ts'}]} as any,
      {id: 'rc-3', fileLocations: [{filePath: '/repo/other.ts'}]} as any,
    ];
    vi.spyOn(RefactoringCandidateMapper, 'map').mockReturnValue(mapped as any);

    service.setActiveFilePath('/repo/a.ts');
    service.setFileFilter(FileFilterMode.Active);

    const p = service.loadRefactoringCandidates();

    const categories = Object.values(RefactoringCategory);
    for (const category of categories) {
      httpMock
        .expectOne(refactoringEndpoint(category))
        .flush({refactoringCandidates: []} satisfies RefactoringCandidatesResponse);
    }
    await p;

    const finding = service.refactoringCandidates()!;
    expect(finding.data?.map((x: any) => x.id)).toEqual(['rc-1', 'rc-2']);
  });

  it('filtered* signals: when Active filter is set but activeFilePath is undefined, data becomes empty (documents current behavior)', async () => {
    const mappedSecurity = [{id: 's1', fileLocations: [{filePath: '/repo/a.ts'}]} as any];
    const mappedOsh = [{name: 'd1', fileLocations: [{filePath: '/repo/a.ts'}]} as any];
    const mappedRc = [{id: 'rc1', fileLocations: [{filePath: '/repo/a.ts'}]} as any];

    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue(mappedSecurity as any);
    vi.spyOn(OpenSourceHealthMapper, 'map').mockReturnValue(mappedOsh as any);
    vi.spyOn(RefactoringCandidateMapper, 'map').mockReturnValue(mappedRc as any);

    service.setFileFilter(FileFilterMode.Active);
    expect(service.activeFilePath()).toBeUndefined();

    const pSec = service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await pSec;
    expect(service.securityFindings()?.data).toEqual([]);

    const pOsh = service.loadOpenSourceHealthFindings();
    httpMock.expectOne(findingEndpoint('osh-findings')).flush({
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {timestamp: '2026-01-01T00:00:00Z', properties: []},
      components: [],
      vulnerabilities: [],
    } satisfies OpenSourceHealthResponse);
    await pOsh;
    expect(service.openSourceHealthFindings()?.data).toEqual([]);

    const pRc = service.loadRefactoringCandidates();
    const categories = Object.values(RefactoringCategory);
    for (const category of categories) {
      httpMock
        .expectOne(refactoringEndpoint(category))
        .flush({refactoringCandidates: []} satisfies RefactoringCandidatesResponse);
    }
    await pRc;
    expect(service.refactoringCandidates()?.data).toEqual([]);
  });

  it('setActiveFilePath() updates the activeFilePath signal value', () => {
    expect(service.activeFilePath()).toBeUndefined();

    service.setActiveFilePath('/repo/src/app/a.ts');

    expect(service.activeFilePath()).toBe('/repo/src/app/a.ts');
  });

  it('setFileFilter() toggles displayActivePath based on filter mode', () => {
    service.setActiveFilePath('/repo/src/app/some-file.ts');

    // Default is "All" => displayActivePath should be empty
    expect(service.displayActivePath()).toBe('');

    service.setFileFilter(FileFilterMode.Active);
    expect(service.displayActivePath()).toBe('some-file.ts');

    service.setFileFilter(FileFilterMode.All);
    expect(service.displayActivePath()).toBe('');
  });

  it('when file filter is Active but activeFilePath is null/undefined, displayActivePath is empty', () => {
    service.setFileFilter(FileFilterMode.Active);

    expect(service.activeFilePath()).toBeUndefined();
    expect(service.displayActivePath()).toBe('');
  });

  it('loadSecurityFindings() fetches via API, maps, and stores data', async () => {
    const mapped = [{ id: 'mapped-security' }] as any;
    const mapperSpy = vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue(mapped);

    const p = service.loadSecurityFindings();

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
    await p;

    expect(mapperSpy).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith(apiPayload);

    const finding = service.securityFindings()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('loadOpenSourceHealthFindings() fetches via API, maps, and stores data', async () => {
    const mapped = [{ name: 'mapped-osh' }] as any;
    const mapperSpy = vi.spyOn(OpenSourceHealthMapper, 'map').mockReturnValue(mapped);

    const p = service.loadOpenSourceHealthFindings();

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
    await p;

    expect(mapperSpy).toHaveBeenCalledTimes(1);
    expect(mapperSpy).toHaveBeenCalledWith(apiPayload);

    const finding = service.openSourceHealthFindings()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('loadRefactoringCandidates() fetches all categories via API, maps, and stores data', async () => {
    const mapped = [{ id: 'mapped-rc' }] as any;
    const mapperSpy = vi.spyOn(RefactoringCandidateMapper, 'map').mockReturnValue(mapped);

    const p = service.loadRefactoringCandidates();

    const categories = Object.values(RefactoringCategory);

    for (const category of categories) {
      const req = httpMock.expectOne(refactoringEndpoint(category));
      expect(req.request.method).toBe('GET');
      req.flush({ refactoringCandidates: [] } satisfies RefactoringCandidatesResponse);
    }
    await p;

    expect(mapperSpy).toHaveBeenCalledTimes(1);

    const aggregatedArg = mapperSpy.mock.calls[0][0] as Record<string, RefactoringCandidatesResponse>;
    for (const category of categories) {
      expect(aggregatedArg[category]).toEqual({ refactoringCandidates: [] });
    }

    const finding = service.refactoringCandidates()!;
    expect(finding.data).toBe(mapped);
    expect(finding.error).toBeUndefined();
  });

  it('does not refetch when data already exists and forceRefresh is not set', async () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue([] as any);

    const p1 = service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await p1;

    await service.loadSecurityFindings(); // ignored
    httpMock.expectNone(findingEndpoint('security-findings'));
  });

  it('refetches when forceRefresh is true', async () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue([] as any);

    const p1 = service.loadSecurityFindings();
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await p1;

    const p2 = service.loadSecurityFindings(true);
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    await p2;
  });

  it('stores a fetch error when the HTTP request fails', async () => {
    const p = service.loadSecurityFindings();

    const req = httpMock.expectOne(findingEndpoint('security-findings'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    await p;

    const finding = service.securityFindings()!;
    expect(finding.data).toBeUndefined();
    expect(finding.error).toBe('Server error (500) while fetching security findings. Please try again later.');
  });

  it('stores a mapping error when the mapper throws', async () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockImplementation(() => {
      throw new Error('mapper boom');
    });

    const p = service.loadSecurityFindings();

    const req = httpMock.expectOne(findingEndpoint('security-findings'));
    req.flush([] as SecurityFindingResponse[]);
    await p;

    const finding = service.securityFindings()!;
    expect(finding.data).toBeUndefined();
    expect(finding.error).toBe('Error occurred while mapping response to security findings.');
  });

  it('loadAllFindings() calls all three loaders with forceRefresh=true', async () => {
    const loadRefactoringSpy = vi
      .spyOn(service, 'loadRefactoringCandidates')
      .mockImplementation(() => Promise.resolve());

    const loadSecuritySpy = vi
      .spyOn(service, 'loadSecurityFindings')
      .mockImplementation(() => Promise.resolve());

    const loadOshSpy = vi
      .spyOn(service, 'loadOpenSourceHealthFindings')
      .mockImplementation(() => Promise.resolve());

    await service.loadAllFindings();

    expect(loadRefactoringSpy).toHaveBeenCalledTimes(1);
    expect(loadRefactoringSpy).toHaveBeenCalledWith(true);

    expect(loadSecuritySpy).toHaveBeenCalledTimes(1);
    expect(loadSecuritySpy).toHaveBeenCalledWith(true);

    expect(loadOshSpy).toHaveBeenCalledTimes(1);
    expect(loadOshSpy).toHaveBeenCalledWith(true);
  });

  it('loadAllFindings() toggles isRefreshing true while running, then false when finished (even if loaders are async)', async () => {
    let resolveRefactoring!: () => void;
    let resolveSecurity!: () => void;
    let resolveOsh!: () => void;

    vi.spyOn(service, 'loadRefactoringCandidates').mockImplementation(
      () => new Promise<void>((resolve) => { resolveRefactoring = resolve; }),
    );
    vi.spyOn(service, 'loadSecurityFindings').mockImplementation(
      () => new Promise<void>((resolve) => { resolveSecurity = resolve; }),
    );
    vi.spyOn(service, 'loadOpenSourceHealthFindings').mockImplementation(
      () => new Promise<void>((resolve) => { resolveOsh = resolve; }),
    );

    expect(service.isRefreshing()).toBe(false);

    const p = service.loadAllFindings();

    // after calling loadAllFindings(), the flag should be set synchronously
    expect(service.isRefreshing()).toBe(true);

    resolveRefactoring();
    resolveSecurity();

    // still waiting for OSH => still refreshing
    await Promise.resolve(); // allow microtasks to run
    expect(service.isRefreshing()).toBe(true);

    resolveOsh();
    await p;

    expect(service.isRefreshing()).toBe(false);
  });

  it('loadAllFindings() sets isRefreshing back to false even when a loader rejects', async () => {
    vi.spyOn(service, 'loadRefactoringCandidates').mockResolvedValue();
    vi.spyOn(service, 'loadSecurityFindings').mockRejectedValue(new Error('boom'));
    vi.spyOn(service, 'loadOpenSourceHealthFindings').mockResolvedValue();

    expect(service.isRefreshing()).toBe(false);

    await expect(service.loadAllFindings()).rejects.toThrow('boom');

    expect(service.isRefreshing()).toBe(false);
  });

  it('loadAllFindings() triggers HTTP fetches for refactoring, security, and open source health findings', async () => {
    vi.spyOn(SecurityFindingMapper, 'map').mockReturnValue([] as any);
    vi.spyOn(OpenSourceHealthMapper, 'map').mockReturnValue([] as any);
    vi.spyOn(RefactoringCandidateMapper, 'map').mockReturnValue([] as any);

    expect(service.isRefreshing()).toBe(false);

    const p = service.loadAllFindings();
    expect(service.isRefreshing()).toBe(true);

    // Security + OSH are single endpoints
    httpMock.expectOne(findingEndpoint('security-findings')).flush([] as SecurityFindingResponse[]);
    httpMock.expectOne(findingEndpoint('osh-findings')).flush({
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {timestamp: '2026-01-01T00:00:00Z', properties: []},
      components: [],
      vulnerabilities: [],
    } satisfies OpenSourceHealthResponse);

    // Refactoring candidates fetch once per category
    const categories = Object.values(RefactoringCategory);
    for (const category of categories) {
      httpMock
        .expectOne(refactoringEndpoint(category))
        .flush({refactoringCandidates: []} satisfies RefactoringCandidatesResponse);
    }

    await p;
    expect(service.isRefreshing()).toBe(false);
  });
});
