import * as vscode from 'vscode';
import { VsCodeCommand } from './vscode-command';
import { VsCodeCommandData } from './vscode-command-data';

export class OpenMetadataEditorCommand implements VsCodeCommand<undefined> {
  execute(data: VsCodeCommandData<undefined>): void {
    const config = vscode.workspace.getConfiguration('sigrid-vscode');
    const portfolio = config.get<string>('portfolioName') || config.get<string>('customer');
    const system = config.get<string>('system');
    const sigridUrl = config.get<string>('sigridUrl') || 'https://sigrid-says.com';

    if (!portfolio || !system) {
      vscode.window.showErrorMessage('Portfolio and system must be configured to open metadata editor.');
      return;
    }

    const url = `${sigridUrl}/${portfolio}/${system}/-/settings/metadata`;
    vscode.env.openExternal(vscode.Uri.parse(url));
  }
}
