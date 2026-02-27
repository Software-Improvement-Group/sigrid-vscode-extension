import {HttpClient} from '@angular/common/http';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideHttpClientTesting, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {authInterceptor} from './auth-interceptor';
import {SigridConfiguration} from '../services/sigrid-configuration';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function configure(token: string, sigridApiBaseUrl = 'https://sigrid.example.invalid') {
    const getConfiguration = vi.fn(() => (() => ({apiKey: token})) as unknown as () => {apiKey?: string});
    const getSigridApiBaseUrl = vi.fn(() => sigridApiBaseUrl);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: SigridConfiguration,
          useValue: {getConfiguration, getSigridApiBaseUrl},
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    return {getConfiguration, getSigridApiBaseUrl, sigridApiBaseUrl};
  }

  beforeEach(() => {
    // Ensure a fresh TestBed per test (Vitest runs in the same process)
    TestBed.resetTestingModule();
  });

  it('adds Authorization header for SIGRID API requests when token exists', () => {
    const {sigridApiBaseUrl} = configure('test-token');

    http.get(`${sigridApiBaseUrl}/ping`).subscribe();

    const req = httpMock.expectOne(`${sigridApiBaseUrl}/ping`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({});
    httpMock.verify();
  });

  it('does not add Authorization header for SIGRID API requests when token is empty', () => {
    const {sigridApiBaseUrl} = configure('');

    http.get(`${sigridApiBaseUrl}/ping`).subscribe();

    const req = httpMock.expectOne(`${sigridApiBaseUrl}/ping`);
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
    httpMock.verify();
  });

  it('does not add Authorization header for non-SIGRID requests (and does not query configuration)', () => {
    const {getConfiguration, getSigridApiBaseUrl} = configure('test-token');

    const externalUrl = 'https://example.invalid/api';
    http.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.headers.has('Authorization')).toBe(false);

    // Interceptor still needs the base URL to decide, but should not read the token/config for non-matching URLs.
    expect(getSigridApiBaseUrl).toHaveBeenCalled();
    expect(getConfiguration).not.toHaveBeenCalled();

    req.flush({});
    httpMock.verify();
  });
});
