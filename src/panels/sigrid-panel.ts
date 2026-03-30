import { Disposable, Uri, Webview, WebviewView, WebviewViewProvider, window, workspace } from "vscode";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp, EXTENSION_ID } from "../extension.config";
import { getNonce } from "../utilities/get-nonce";
import { VsCodeCommandEvent } from "../commands/vscode-command-event";
import { COMMANDS } from "../commands/command-registry";
import { VsCodeCommandData } from "../commands/vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";

export class SigridPanel implements WebviewViewProvider {
  private disposables: Disposable[] = [];
  private webviewView?: WebviewView;

  constructor(private readonly extensionUri: Uri) {}

  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    this.webviewView = webviewView;

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

    webviewView.onDidDispose(() => {
      this.dispose();
    }, null, this.disposables);
  }

  private getWebviewContent(webview: Webview) {
    const styleUri = getWebviewUri(webview, this.extensionUri, AngularApp.outputFolder, 'styles.css');
    const scriptUri = getWebviewUri(webview, this.extensionUri, AngularApp.outputFolder, 'main.js');
    console.log("Script URI:", scriptUri);

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
        COMMANDS[message.command]?.execute(new VsCodeCommandData(webview, message.data));
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
        const newConfig = workspace.getConfiguration().get(EXTENSION_ID);
        webview.postMessage({ command: "configurationChanged", data: newConfig });
      }
    }, undefined, this.disposables);
  }

  dispose() {
    this.webviewView = undefined;

    // Dispose all disposables (i.e. commands) for the current webview view
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

