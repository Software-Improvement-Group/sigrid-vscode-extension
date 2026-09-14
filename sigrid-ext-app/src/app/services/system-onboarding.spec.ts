import {TestBed} from '@angular/core/testing';
import {describe, beforeEach, afterEach, expect, it, vi} from 'vitest';

import {SystemOnboarding} from './system-onboarding';
import {VsCode} from './vs-code';

describe('SystemOnboarding', () => {
  const createService = () => {
    const vsCodeMock: Pick<VsCode, 'checkSystemOnboarded' | 'onboardSystem'> = {
      checkSystemOnboarded: vi.fn(),
      onboardSystem: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SystemOnboarding,
        {provide: VsCode, useValue: vsCodeMock},
      ],
    });

    return {service: TestBed.inject(SystemOnboarding), vsCodeMock};
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('check() sets status to "checking", clears the error, and asks the extension host', () => {
    const {service, vsCodeMock} = createService();

    service.check();

    expect(service.status()).toBe('checking');
    expect(service.errorMessage()).toBeNull();
    expect(vsCodeMock.checkSystemOnboarded).toHaveBeenCalledTimes(1);
  });

  it('onboard() sets status to "onboarding" and asks the extension host to onboard', () => {
    const {service, vsCodeMock} = createService();

    service.onboard();

    expect(service.status()).toBe('onboarding');
    expect(service.errorMessage()).toBeNull();
    expect(vsCodeMock.onboardSystem).toHaveBeenCalledTimes(1);
  });

  it('onCheckResult() applies the reported status and message', () => {
    const {service} = createService();

    service.onCheckResult({status: 'onboarded'});
    expect(service.status()).toBe('onboarded');

    service.onCheckResult({status: 'error', message: 'kaboom'});
    expect(service.status()).toBe('error');
    expect(service.errorMessage()).toBe('kaboom');
  });

  it('onCheckResult() reports "not-onboarded" as-is when onboarding was never started', () => {
    const {service} = createService();

    service.onCheckResult({status: 'not-onboarded'});

    expect(service.status()).toBe('not-onboarded');
  });

  it('onOnboardResult() sets status to "onboarding-started" on success', () => {
    const {service} = createService();

    service.onOnboardResult({success: true});

    expect(service.status()).toBe('onboarding-started');
    expect(service.errorMessage()).toBeNull();
  });

  it('onOnboardResult() sets status to "error" with the reported message on failure', () => {
    const {service} = createService();

    service.onOnboardResult({success: false, error: 'upload failed'});

    expect(service.status()).toBe('error');
    expect(service.errorMessage()).toBe('upload failed');
  });

  it('onOnboardResult() falls back to a default error message when none is provided', () => {
    const {service} = createService();

    service.onOnboardResult({success: false});

    expect(service.errorMessage()).toBe('Onboarding failed.');
  });

  it('treats a "not-onboarded" check as "onboarding-started" once onboarding has been triggered successfully', () => {
    const {service} = createService();

    service.onOnboardResult({success: true});
    service.onCheckResult({status: 'not-onboarded'});

    expect(service.status()).toBe('onboarding-started');
  });
});
