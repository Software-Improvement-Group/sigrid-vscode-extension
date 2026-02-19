import {Injectable} from '@angular/core';
import {WebviewApi} from 'vscode-webview';
import {VsCommand} from '../models/vs-command';
import {VsCommandType} from '../models/vs-command-type';
import {VsMessageData, VsMessageSeverity} from '../models/vs-message-data';
import {FileLocation} from '../models/file-location';

@Injectable({
  providedIn: 'root',
})
export class VsCode {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();
    } else {
      console.error('VS Code API not available.');
    }
  }

  postMessage(message: string, severity = VsMessageSeverity.Info) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.Message, new VsMessageData(message, severity)));
  }

  openFile(location: FileLocation) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.OpenFile, location));
  }

}
