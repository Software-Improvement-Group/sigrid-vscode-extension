import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {SigridApi} from './sigrid-api';
import {SigridApiTransport} from './sigrid-api-transport';
import {FakeSigridApiTransport} from './fake-sigrid-api-transport';
import {RefactoringCategory} from '../models/refactoring-category';
import {RefactoringCandidatesResponse} from '../models/refactoring-candidate';
import {OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {SecurityFindingResponse} from '../models/security-finding';

describe('SigridApi', () => {
  let service: SigridApi;
  let transport: FakeSigridApiTransport;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SigridApi,
        {provide: SigridApiTransport, useClass: FakeSigridApiTransport},
      ],
    });

    service = TestBed.inject(SigridApi);
    transport = TestBed.inject(SigridApiTransport) as unknown as FakeSigridApiTransport;
  });

  afterEach(() => {
    transport.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getOpenSourceHealthFindings() issues GET to the expected resource', async () => {
    const result = service.getOpenSourceHealthFindings();

    const req = transport.expectOne(['osh-findings']);
    expect(req.request.method).toBe('GET');

    const payload: OpenSourceHealthResponse = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {timestamp: '2026-01-01T00:00:00Z', properties: []},
      components: [],
      vulnerabilities: [],
    };
    req.flush(payload);

    expect(await result).toEqual(payload);
  });

  it('getSecurityFindings() issues GET to the expected resource', async () => {
    const result = service.getSecurityFindings();

    const req = transport.expectOne(['security-findings']);
    expect(req.request.method).toBe('GET');

    const payload: SecurityFindingResponse[] = [];
    req.flush(payload);

    expect(await result).toEqual(payload);
  });

  it('getRefactoringCandidates(category) issues GET to the expected resource', async () => {
    const result = service.getRefactoringCandidates(RefactoringCategory.Duplication);

    const req = transport.expectOne(['refactoring-candidates', RefactoringCategory.Duplication]);
    expect(req.request.method).toBe('GET');

    const payload: RefactoringCandidatesResponse = {refactoringCandidates: []};
    req.flush(payload);

    expect(await result).toEqual(payload);
  });

  it('getAllRefactoringCandidates() requests each category and returns a record keyed by category', async () => {
    const categories = Object.values(RefactoringCategory);
    const result = service.getAllRefactoringCandidates();

    for (const category of categories) {
      const req = transport.expectOne(['refactoring-candidates', category]);
      expect(req.request.method).toBe('GET');
      req.flush({
        refactoringCandidates: [{id: `id-${category}`} as any],
      } satisfies RefactoringCandidatesResponse);
    }

    const actual = await result;
    for (const category of categories) {
      expect(actual[category].refactoringCandidates[0].id).toBe(`id-${category}`);
    }
  });

  it('editFinding() issues PATCH with the request body', async () => {
    const result = service.editFinding('finding-1', {status: 'ACCEPTED', remark: 'ok'});

    const req = transport.expectOne(['findings', 'finding-1']);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({status: 'ACCEPTED', remark: 'ok'});
    req.flush(undefined, {status: 204});

    await expect(result).resolves.toBeUndefined();
  });
});
