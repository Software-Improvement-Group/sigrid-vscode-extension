import {VsCommandHandler} from './vs-command-handler';
import {SigridData} from '../services/sigrid-data';

export class ActiveEditorChangedCommand implements VsCommandHandler<EditorPath> {
  constructor(private sigridData: SigridData) {
  }

  execute(payload: EditorPath): void {
    this.sigridData.setActiveFilePath(payload.filePath);
  }
}

interface EditorPath {
  filePath: string;
}
