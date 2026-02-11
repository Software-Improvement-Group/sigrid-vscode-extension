import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SigridApi } from './sigrid-api';
import { SigridConfiguration } from './sigrid-configuration';
import { SIGRID_API_BASE_URL } from '../utilities/constants';
import { joinUrl } from '../utilities/join-url';
import { RefactoringCategory } from '../models/refactoring-category';
import { RefactoringCandidatesResponse } from '../models/refactoring-candidate';
import { OpenSourceHealthResponse } from '../models/open-source-health-dependency';
import { SecurityFindingResponse } from '../models/security-finding';

describe('SigridApi', () => {
  let service: SigridApi;
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

  let configStub: SigridConfigurationStub;

  const configuredUrl = (...paths: string[]) =>
    joinUrl(SIGRID_API_BASE_URL, ...paths, 'cust', 'sys');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SigridApi,
        { provide: SigridConfiguration, useClass: SigridConfigurationStub },
      ],
    });

    service = TestBed.inject(SigridApi);
    httpMock = TestBed.inject(HttpTestingController);
    configStub = TestBed.inject(SigridConfiguration) as unknown as SigridConfigurationStub;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOpenSourceHealthFindings() issues GET to the expected endpoint', () => {
    let actual: OpenSourceHealthResponse | undefined;

    service.getOpenSourceHealthFindings().subscribe((res) => (actual = res));

    const req = httpMock.expectOne(configuredUrl('osh-findings'));
    expect(req.request.method).toBe('GET');

    const payload: OpenSourceHealthResponse = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: { timestamp: '2026-01-01T00:00:00Z', properties: [] },
      components: [],
      vulnerabilities: [],
    };
    req.flush(payload);

    expect(actual).toEqual(payload);
  });

  it('getSecurityFindings() issues GET to the expected endpoint', () => {
    let actual: SecurityFindingResponse[] | undefined;

    service.getSecurityFindings().subscribe((res) => (actual = res));

    const req = httpMock.expectOne(configuredUrl('security-findings'));
    expect(req.request.method).toBe('GET');

    const payload: SecurityFindingResponse[] = [];
    req.flush(payload);

    expect(actual).toEqual(payload);
  });

  it('getRefactoringCandidates(category) issues GET to the expected endpoint', () => {
    let actual: RefactoringCandidatesResponse | undefined;

    service.getRefactoringCandidates(RefactoringCategory.Duplication).subscribe((res) => (actual = res));

    const req = httpMock.expectOne(
      joinUrl(
        SIGRID_API_BASE_URL,
        'refactoring-candidates',
        'cust',
        'sys',
        RefactoringCategory.Duplication
      )
    );
    expect(req.request.method).toBe('GET');

    const payload: RefactoringCandidatesResponse = { refactoringCandidates: [] };
    req.flush(payload);

    expect(actual).toEqual(payload);
  });

  it('getAllRefactoringCandidates() requests each category and returns a record keyed by category', () => {
    const categories = Object.values(RefactoringCategory);

    let actual: Record<string, RefactoringCandidatesResponse> | undefined;
    service.getAllRefactoringCandidates().subscribe((res) => (actual = res));

    // Expect one request per category and flush distinct payloads
    for (const category of categories) {
      const req = httpMock.expectOne(
        joinUrl(SIGRID_API_BASE_URL, 'refactoring-candidates', 'cust', 'sys', category)
      );
      expect(req.request.method).toBe('GET');

      req.flush({
        refactoringCandidates: [
          {
            id: `id-${category}`,
            severity: 'high',
            weight: 1,
            status: 'in_progress',
            technology: 'ts',
            snapshotDate: '2026-01-01',
          } as any,
        ],
      } satisfies RefactoringCandidatesResponse);
    }

    expect(actual).toBeTruthy();
    for (const category of categories) {
      expect(actual![category]).toBeTruthy();
      expect(actual![category].refactoringCandidates[0].id).toBe(`id-${category}`);
    }
  });

  it('uses empty configuration when SigridConfiguration has no configuration set', () => {
    configStub.setConfiguration({ apiKey: '', customer: '', system: '' });

    service.getSecurityFindings().subscribe();

    const req = httpMock.expectOne(joinUrl(SIGRID_API_BASE_URL, 'security-findings', '', ''));
    expect(req.request.method).toBe('GET');
    req.flush([] as SecurityFindingResponse[]);
  });
});
