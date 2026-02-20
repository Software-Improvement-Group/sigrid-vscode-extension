import {TestBed} from '@angular/core/testing';
import {describe, beforeEach, afterEach, expect, it, vi} from 'vitest';

import {VsCode} from './vs-code';
import {VsCommand} from '../models/vs-command';
import {VsCommandType} from '../models/vs-command-type';
import {VsMessageData, VsMessageSeverity} from '../models/vs-message-data';
import type {FileLocation} from '../models/file-location';

describe('VsCode service', () => {
  const originalAcquire = (globalThis as any).acquireVsCodeApi;

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    if (originalAcquire === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as any).acquireVsCodeApi;
    } else {
      (globalThis as any).acquireVsCodeApi = originalAcquire;
    }

    vi.restoreAllMocks();
  });

  it('logs an error when VS Code API is not available', () => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as any).acquireVsCodeApi;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [VsCode],
    });

    const svc = TestBed.inject(VsCode);
    expect(svc).toBeTruthy();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toBe('VS Code API not available.');
  });

  it('postMessage() sends a VsCommand(Message) with VsMessageData and default severity Info', () => {
    const postMessageSpy = vi.fn();
    (globalThis as any).acquireVsCodeApi = vi.fn(() => ({postMessage: postMessageSpy}));

    TestBed.configureTestingModule({
      providers: [VsCode],
    });

    const svc = TestBed.inject(VsCode);

    svc.postMessage('Hello');

    expect(postMessageSpy).toHaveBeenCalledTimes(1);

    const arg = postMessageSpy.mock.calls[0]![0] as VsCommand<unknown>;
    expect(arg).toBeInstanceOf(VsCommand);
    expect(arg.command).toBe(VsCommandType.Message);

    const data = arg.data as VsMessageData;
    expect(data).toBeInstanceOf(VsMessageData);
    expect(data.text).toBe('Hello');
    expect(data.severity).toBe(VsMessageSeverity.Info);
  });

  it('postMessage() uses provided severity', () => {
    const postMessageSpy = vi.fn();
    (globalThis as any).acquireVsCodeApi = vi.fn(() => ({postMessage: postMessageSpy}));

    TestBed.configureTestingModule({
      providers: [VsCode],
    });

    const svc = TestBed.inject(VsCode);

    svc.postMessage('Something happened', VsMessageSeverity.Error);

    const arg = postMessageSpy.mock.calls[0]![0] as VsCommand<unknown>;
    expect(arg.command).toBe(VsCommandType.Message);

    const data = arg.data as VsMessageData;
    expect(data.text).toBe('Something happened');
    expect(data.severity).toBe(VsMessageSeverity.Error);
  });

  it('openFile() sends a VsCommand(OpenFile) with the FileLocation', () => {
    const postMessageSpy = vi.fn();
    (globalThis as any).acquireVsCodeApi = vi.fn(() => ({postMessage: postMessageSpy}));

    TestBed.configureTestingModule({
      providers: [VsCode],
    });

    const svc = TestBed.inject(VsCode);

    const location: FileLocation = {filePath: '/repo/src/file.ts', startLine: 10, endLine: 20} as any;
    svc.openFile(location);

    expect(postMessageSpy).toHaveBeenCalledTimes(1);

    const arg = postMessageSpy.mock.calls[0]![0] as VsCommand<FileLocation>;
    expect(arg).toBeInstanceOf(VsCommand);
    expect(arg.command).toBe(VsCommandType.OpenFile);
    expect(arg.data).toEqual(location);
  });

  it('does not throw if acquireVsCodeApi exists but returns undefined', () => {
    (globalThis as any).acquireVsCodeApi = vi.fn(() => undefined);

    TestBed.configureTestingModule({
      providers: [VsCode],
    });

    const svc = TestBed.inject(VsCode);

    expect(() => svc.postMessage('x')).not.toThrow();
    expect(() => svc.openFile({filePath: '/x'} as any)).not.toThrow();
  });
});
