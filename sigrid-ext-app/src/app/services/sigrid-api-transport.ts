import {inject, Injectable} from '@angular/core';
import {VsCode} from './vs-code';
import {SigridApiError, SigridApiRequestData, SigridApiResponseData} from '../models/sigrid-api-message';

const REQUEST_TIMEOUT_MS = 60_000;

interface PendingRequest {
  resolve: (body: unknown) => void;
  reject: (error: SigridApiError) => void;
}

/** Sends Sigrid API requests to the extension host (the webview origin is blocked by the API's CORS policy). */
@Injectable({
  providedIn: 'root',
})
export class SigridApiTransport {
  private readonly vscode = inject(VsCode);
  private readonly pending = new Map<string, PendingRequest>();

  request<T>(request: Omit<SigridApiRequestData, 'requestId'>): Promise<T> {
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, {resolve: resolve as (body: unknown) => void, reject});
      setTimeout(() => this.settle({requestId, status: 0}), REQUEST_TIMEOUT_MS);
      this.vscode.sigridApiRequest({...request, requestId});
    });
  }

  onResponse(response: SigridApiResponseData) {
    this.settle(response);
  }

  private settle(response: SigridApiResponseData) {
    const request = this.pending.get(response.requestId);
    if (!request) {
      return;
    }
    this.pending.delete(response.requestId);
    if (response.status >= 200 && response.status < 300) {
      request.resolve(response.body);
    } else {
      request.reject(new SigridApiError(response.status));
    }
  }
}
