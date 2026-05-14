import {Injectable} from '@angular/core';
import {WebviewApi} from 'vscode-webview';
import {VsCommand} from '../models/vs-command';
import {VsCommandType} from '../models/vs-command-type';
import {VsMessageData, VsMessageSeverity} from '../models/vs-message-data';
import {FileLocation} from '../models/file-location';
import {UsageData} from '../models/usage-data';
import {CreateJiraIssuePayload} from '../models/create-jira-issue-payload';

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

  initialize() {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.Initialize));
  }

  showMessage(message: string, severity = VsMessageSeverity.Info) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.Message, new VsMessageData(message, severity)));
  }

  openFile(location: FileLocation) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.OpenFile, location));
  }

  openUrl(url: string) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.OpenUrl, url));
  }

  sendUsageStatistics(usageData: UsageData) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.SendUsageStatistics, usageData));
  }

  createJiraIssue(payload: CreateJiraIssuePayload) {
    this.vsCodeApi?.postMessage(new VsCommand(VsCommandType.CreateJiraIssue, payload));
  }
}
