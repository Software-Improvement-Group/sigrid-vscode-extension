import {describe, expect, it, vi} from 'vitest';
import {ActiveEditorChangedCommand} from './active-editor-changed-command';
import type {SigridData} from '../services/sigrid-data';

describe('ActiveEditorChangedCommand', () => {
  it('calls SigridData.setActiveFilePath with payload.filePath', () => {
    const sigridDataMock: Pick<SigridData, 'setActiveFilePath'> = {
      setActiveFilePath: vi.fn(),
    };

    const cmd = new ActiveEditorChangedCommand(sigridDataMock as SigridData);

    cmd.execute({filePath: '/repo/src/app/a.ts'});

    expect(sigridDataMock.setActiveFilePath).toHaveBeenCalledTimes(1);
    expect(sigridDataMock.setActiveFilePath).toHaveBeenCalledWith('/repo/src/app/a.ts');
  });

  it('does not throw for an empty filePath (documents current behavior)', () => {
    const sigridDataMock: Pick<SigridData, 'setActiveFilePath'> = {
      setActiveFilePath: vi.fn(),
    };

    const cmd = new ActiveEditorChangedCommand(sigridDataMock as SigridData);

    expect(() => cmd.execute({filePath: ''})).not.toThrow();
    expect(sigridDataMock.setActiveFilePath).toHaveBeenCalledWith('');
  });
});
