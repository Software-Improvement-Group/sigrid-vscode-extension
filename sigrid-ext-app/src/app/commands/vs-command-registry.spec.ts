import {TestBed} from '@angular/core/testing';
import {describe, afterEach, expect, it, vi} from 'vitest';

import {VsCommandRegistry} from './vs-command-registry';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {InitializeCommand} from './initialize-command';
import {ActiveEditorChangedCommand} from './active-editor-changed-command';

describe('VsCommandRegistry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('executes the "initialize" command handler with the given payload', () => {
    const initExecuteSpy = vi.spyOn(InitializeCommand.prototype, 'execute');

    TestBed.configureTestingModule({
      providers: [
        VsCommandRegistry,
        {
          provide: SigridConfiguration,
          useValue: {
            setConfiguration: vi.fn(),
            getConfiguration: vi.fn(),
            getEmptyConfiguration: vi.fn(),
          } satisfies Partial<SigridConfiguration>,
        },
      ],
    });

    const registry = TestBed.inject(VsCommandRegistry);

    const payload = {apiKey: '<api-key>', customer: 'acme', system: 'sys'} as any;
    registry.execute('initialize', payload);

    expect(initExecuteSpy).toHaveBeenCalledTimes(1);
    expect(initExecuteSpy).toHaveBeenCalledWith(payload);
  });

  it('executes the "activeEditorChanged" command handler with the given payload', () => {
    const activeExecuteSpy = vi.spyOn(ActiveEditorChangedCommand.prototype, 'execute');

    TestBed.configureTestingModule({
      providers: [
        VsCommandRegistry,
        {
          provide: SigridConfiguration,
          useValue: {
            setConfiguration: vi.fn(),
            getConfiguration: vi.fn(),
            getEmptyConfiguration: vi.fn(),
          } satisfies Partial<SigridConfiguration>,
        },
      ],
    });

    const registry = TestBed.inject(VsCommandRegistry);

    const payload = {filePath: 'repo/src/a.ts'} as any;
    registry.execute('activeEditorChanged', payload);

    expect(activeExecuteSpy).toHaveBeenCalledTimes(1);
    expect(activeExecuteSpy).toHaveBeenCalledWith(payload);
  });

  it('does nothing for unknown commands (no throw)', () => {
    const initExecuteSpy = vi.spyOn(InitializeCommand.prototype, 'execute');
    const activeExecuteSpy = vi.spyOn(ActiveEditorChangedCommand.prototype, 'execute');

    TestBed.configureTestingModule({
      providers: [
        VsCommandRegistry,
        {
          provide: SigridConfiguration,
          useValue: {
            setConfiguration: vi.fn(),
            getConfiguration: vi.fn(),
            getEmptyConfiguration: vi.fn(),
          } satisfies Partial<SigridConfiguration>,
        },
      ],
    });

    const registry = TestBed.inject(VsCommandRegistry);

    expect(() => registry.execute('doesNotExist', {x: 1})).not.toThrow();

    expect(initExecuteSpy).not.toHaveBeenCalled();
    expect(activeExecuteSpy).not.toHaveBeenCalled();
  });
});
