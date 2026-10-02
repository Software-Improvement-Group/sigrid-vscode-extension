import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {SigridApiTransport} from './sigrid-api-transport';
import {VsCode} from './vs-code';
import {SigridApiError, SigridApiRequestData} from '../models/sigrid-api-message';

describe('SigridApiTransport', () => {
  const sigridApiRequest = vi.fn<(request: SigridApiRequestData) => void>();
  let transport: SigridApiTransport;

  beforeEach(() => {
    sigridApiRequest.mockReset();
    TestBed.configureTestingModule({
      providers: [{provide: VsCode, useValue: {sigridApiRequest}}],
    });
    transport = TestBed.inject(SigridApiTransport);
  });

  it('posts the request to the host and resolves with the response body', async () => {
    const result = transport.request({method: 'GET', path: ['security-findings']});

    const sent = sigridApiRequest.mock.calls[0][0];
    expect(sent).toMatchObject({method: 'GET', path: ['security-findings']});
    transport.onResponse({requestId: sent.requestId, status: 200, body: ['a']});

    await expect(result).resolves.toEqual(['a']);
  });

  it('rejects with a SigridApiError carrying the status for non-2xx responses', async () => {
    const result = transport.request({method: 'GET', path: ['osh-findings']});

    transport.onResponse({requestId: sigridApiRequest.mock.calls[0][0].requestId, status: 401});

    await expect(result).rejects.toEqual(expect.objectContaining({status: 401}));
    await expect(result).rejects.toBeInstanceOf(SigridApiError);
  });

  it('matches responses to requests by id', async () => {
    const first = transport.request({method: 'GET', path: ['osh-findings']});
    const second = transport.request({method: 'GET', path: ['security-findings']});
    const [firstId, secondId] = sigridApiRequest.mock.calls.map((call) => call[0].requestId);

    transport.onResponse({requestId: secondId, status: 200, body: 'second'});
    transport.onResponse({requestId: firstId, status: 200, body: 'first'});

    await expect(first).resolves.toBe('first');
    await expect(second).resolves.toBe('second');
  });

  it('ignores responses for unknown requests', () => {
    expect(() => transport.onResponse({requestId: 'unknown', status: 200})).not.toThrow();
  });

  it('rejects with status 0 when no response arrives in time', async () => {
    vi.useFakeTimers();
    try {
      const result = transport.request({method: 'GET', path: ['osh-findings']});
      const assertion = expect(result).rejects.toEqual(expect.objectContaining({status: 0}));
      await vi.advanceTimersByTimeAsync(60_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
