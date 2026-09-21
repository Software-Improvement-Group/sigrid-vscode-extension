export interface WebviewMessage {
  command: string;
  data: any;
}

export function isWebviewMessage(data: unknown): data is WebviewMessage {
  return typeof data === 'object'
    && data !== null
    && typeof (data as WebviewMessage).command === 'string';
}
