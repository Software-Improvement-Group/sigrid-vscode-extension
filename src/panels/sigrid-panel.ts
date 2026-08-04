import { Disposable, extensions, Uri, Webview, WebviewView, WebviewViewProvider, window, workspace } from "vscode";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp, EXTENSION_ID } from "../extension.config";
import { getNonce } from "../utilities/get-nonce";
import { VsCodeCommandEvent } from "../commands/vscode-command-event";
import { COMMANDS } from "../commands/command-registry";
import { VsCodeCommandData } from "../commands/vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";
import { getSigridConfiguration } from "../utilities/configuration";
import { postAiAgentsDetectedMessage } from "../utilities/ai-agents-message";

export class SigridPanel implements WebviewViewProvider {
  private disposables: Disposable[] = [];

  constructor(private readonly extensionUri: Uri) {}

  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      // Enable JavaScript in the webview
      enableScripts: true,
      // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
      localResourceRoots: [Uri.joinPath(this.extensionUri, "out"), Uri.joinPath(this.extensionUri, AngularApp.outputFolder)],
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    this.setWebviewMessageListener(webviewView.webview);
    this.setActiveEditorListener(webviewView.webview);
    this.setConfigurationChangeListener(webviewView.webview);
    this.setAgentDetectionListeners(webviewView);

    webviewView.onDidDispose(() => {
      this.dispose();
    }, null, this.disposables);
  }

  private getWebviewContent(webview: Webview) {
    const styleUri = getWebviewUri(webview, this.extensionUri, AngularApp.outputFolder, 'styles.css');
    const scriptUri = getWebviewUri(webview, this.extensionUri, AngularApp.outputFolder, 'main.js');

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /*html*/`
        <!doctype html>
        <html lang="en" data-beasties-container>
        <head>
          <meta charset="utf-8">
          <title>Sigrid</title>
          <base href="./">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="${styleUri}">
        </head>
        <body>
          <app-root></app-root>
          <script nonce="${nonce}" src="${scriptUri}" type="module"></script>
        </body>
        </html>
        `;
  }

  private setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: VsCodeCommandEvent) => {
        COMMANDS[message.command]?.execute(new VsCodeCommandData(webview, this.extensionUri, message.data));
      },
      undefined,
      this.disposables
    );
  }

  private setActiveEditorListener(webview: Webview) {
    window.onDidChangeActiveTextEditor(editor => {
      postActiveEditorChangedMessage(webview, editor);
    }, undefined, this.disposables);
  }

  private setConfigurationChangeListener(webview: Webview) {
    workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(EXTENSION_ID)) {
        const newConfig = getSigridConfiguration();
        webview.postMessage({ command: "configurationChanged", data: newConfig });
      }
    }, undefined, this.disposables);
  }

  /**
   * Re-detects the available AI agents. Installing an extension raises an event, but installing a
   * CLI does not, so the panel becoming visible or the window regaining focus also triggers a check.
   */
  private setAgentDetectionListeners(webviewView: WebviewView) {
    const webview = webviewView.webview;
    const redetect = () => postAiAgentsDetectedMessage(webview);

    extensions.onDidChange(redetect, undefined, this.disposables);
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        redetect();
      }
    }, undefined, this.disposables);
    window.onDidChangeWindowState(state => {
      if (state.focused && webviewView.visible) {
        redetect();
      }
    }, undefined, this.disposables);
  }

  dispose() {
    // Dispose all disposables (i.e. commands) for the current webview view
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
