import {HttpClient} from '@angular/common/http';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {authInterceptor} from './auth.interceptor';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SIGRID_API_BASE_URL} from '../utilities/constants';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function configure(token: string) {
    const getConfiguration = vi.fn(() => (() => ({apiKey: token})) as unknown as () => {apiKey?: string});

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: SigridConfiguration,
          useValue: {getConfiguration},
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    return {getConfiguration};
  }

  beforeEach(() => {
    // Ensure a fresh TestBed per test (Vitest runs in the same process)
    TestBed.resetTestingModule();
  });

  it('adds Authorization header for SIGRID API requests when token exists', () => {
    configure('test-token');

    http.get(`${SIGRID_API_BASE_URL}/ping`).subscribe();

    const req = httpMock.expectOne(`${SIGRID_API_BASE_URL}/ping`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({});
    httpMock.verify();
  });

  it('does not add Authorization header for SIGRID API requests when token is empty', () => {
    configure('');

    http.get(`${SIGRID_API_BASE_URL}/ping`).subscribe();

    const req = httpMock.expectOne(`${SIGRID_API_BASE_URL}/ping`);
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
    httpMock.verify();
  });

  it('does not add Authorization header for non-SIGRID requests (and does not query configuration)', () => {
    const {getConfiguration} = configure('test-token');

    const externalUrl = 'https://example.invalid/api';
    http.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.headers.has('Authorization')).toBe(false);

    // Interceptor should not even attempt to read config for non-SIGRID URLs
    expect(getConfiguration).not.toHaveBeenCalled();

    req.flush({});
    httpMock.verify();
  });
});
