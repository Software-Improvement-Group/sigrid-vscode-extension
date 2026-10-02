import {SigridApiError, SigridApiMethod, SigridApiRequestData} from '../models/sigrid-api-message';

interface PendingCall {
  method: SigridApiMethod;
  path: string[];
  body?: unknown;
  resolve: (body: unknown) => void;
  reject: (error: SigridApiError) => void;
}

export interface FakeRequest {
  request: { method: SigridApiMethod; body?: unknown };
  flush: (body: unknown, options?: { status?: number }) => void;
}

/** Test double for SigridApiTransport with an HttpTestingController-like API. */
export class FakeSigridApiTransport {
  private calls: PendingCall[] = [];

  request<T>({method, path, body}: Omit<SigridApiRequestData, 'requestId'>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.calls.push({method, path, body, resolve: resolve as (body: unknown) => void, reject});
    });
  }

  expectOne(path: string[]): FakeRequest {
    const matches = this.calls.filter((call) => call.path.join('/') === path.join('/'));
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one request to ${path.join('/')}, found ${matches.length}`);
    }
    this.calls.splice(this.calls.indexOf(matches[0]), 1);
    return this.toFakeRequest(matches[0]);
  }

  expectNone(path: string[]) {
    if (this.calls.some((call) => call.path.join('/') === path.join('/'))) {
      throw new Error(`Expected no request to ${path.join('/')}`);
    }
  }

  verify() {
    if (this.calls.length > 0) {
      throw new Error(`Unanswered requests: ${this.calls.map((call) => call.path.join('/')).join(', ')}`);
    }
  }

  private toFakeRequest(call: PendingCall): FakeRequest {
    return {
      request: {method: call.method, body: call.body},
      flush: (body, {status = 200} = {}) => {
        if (status >= 200 && status < 300) {
          call.resolve(body);
        } else {
          call.reject(new SigridApiError(status));
        }
      },
    };
  }
}
