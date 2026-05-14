import {describe, expect, it, vi} from 'vitest';
import {WebviewBaseUriCommand} from './webview-base-uri-command';
import type {AppResource} from '../services/app-resource';

describe('WebviewBaseUriCommand', () => {
  it('should create an instance', () => {
    const appResourceMock: Pick<AppResource, 'setWebviewBaseUri'> = {
      setWebviewBaseUri: vi.fn(),
    };

    expect(new WebviewBaseUriCommand(appResourceMock as AppResource)).toBeTruthy();
  });

  it('calls AppResource.setWebviewBaseUri with the provided payload', () => {
    const appResourceMock: Pick<AppResource, 'setWebviewBaseUri'> = {
      setWebviewBaseUri: vi.fn(),
    };

    const cmd = new WebviewBaseUriCommand(appResourceMock as AppResource);

    cmd.execute('https://example.invalid/webview');

    expect(appResourceMock.setWebviewBaseUri).toHaveBeenCalledTimes(1);
    expect(appResourceMock.setWebviewBaseUri).toHaveBeenCalledWith('https://example.invalid/webview');
  });

  it('does not throw for an empty payload and passes it through', () => {
    const appResourceMock: Pick<AppResource, 'setWebviewBaseUri'> = {
      setWebviewBaseUri: vi.fn(),
    };

    const cmd = new WebviewBaseUriCommand(appResourceMock as AppResource);

    expect(() => cmd.execute('')).not.toThrow();
    expect(appResourceMock.setWebviewBaseUri).toHaveBeenCalledWith('');
  });
});
