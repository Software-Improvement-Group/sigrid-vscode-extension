export type SigridApiMethod = 'GET' | 'PATCH';

export interface SigridApiRequestData {
  requestId: string;
  method: SigridApiMethod;
  /** Resource name followed by optional extra segments; the host adds the customer and system. */
  path: string[];
  body?: unknown;
}

export interface SigridApiResponseData {
  requestId: string;
  /** 0 means the request never got a response (network failure or rejected request). */
  status: number;
  body?: unknown;
}

export class SigridApiError extends Error {
  constructor(readonly status: number) {
    super(`Sigrid API request failed with status ${status}`);
  }
}
