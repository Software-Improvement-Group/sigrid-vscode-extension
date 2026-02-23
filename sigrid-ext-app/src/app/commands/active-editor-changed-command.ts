import {VsCommandHandler} from './vs-command-handler';

export class ActiveEditorChangedCommand implements VsCommandHandler<EditorPath>{
    execute(payload: EditorPath): void {
      console.log('Editor path changed to: ', payload);
    }
}

interface EditorPath {
  filePath: string;
}
