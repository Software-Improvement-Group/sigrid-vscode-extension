import { Disposable, Uri, ViewColumn, Webview, WebviewPanel, window, workspace } from "vscode";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp } from "../extension.config";
import { getNonce } from "../utilities/get-nonce";
import { VsCodeCommandEvent } from "../commands/vscode-command-event";
import { COMMANDS } from "../commands/command-registry";

export class SigridPanel {
  static currentPanel: SigridPanel | undefined;
  private disposables: Disposable[] = [];

  private constructor(private readonly panel: WebviewPanel, extensionUri: Uri) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getWebviewContent(this.panel.webview, extensionUri);
    this.setWebviewMessageListener(this.panel.webview);
  }

  /**
  * Renders the current webview panel if it exists otherwise a new webview panel
  * will be created and displayed.
  *
  * @param extensionUri The URI of the directory containing the extension.
  */
  public static render(extensionUri: Uri) {
    if (SigridPanel.currentPanel) {
      // If the webview panel already exists reveal it
      SigridPanel.currentPanel.panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "showSigrid",
        // Panel title
        "Sigrid",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, AngularApp.appFolder, AngularApp.outputFolder)],
          retainContextWhenHidden: true,
        }
      );

      SigridPanel.currentPanel = new SigridPanel(panel, extensionUri);
      
      panel.webview.postMessage({ command: "init", data: workspace.getConfiguration().get("sigrid-vscode")} );
    }
  }

  dispose() {
    SigridPanel.currentPanel = undefined;

    // Dispose the current webview panel
    this.panel.dispose();

    // Dispose all disposables (i.e. commands) for the current webview panel
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private getWebviewContent(webview: Webview, extensionUri: Uri) {
    const styleUri = getWebviewUri(webview, extensionUri, [AngularApp.appFolder, AngularApp.outputFolder, 'styles.css']);
    const scriptUri = getWebviewUri(webview, extensionUri, [AngularApp.appFolder, AngularApp.outputFolder, 'main.js']);

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /*html*/`
        <!doctype html>
        <html lang="en" data-beasties-container>
        <head>
          <meta charset="utf-8">
          <title>Sigrid</title>
          <base href="/">
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
        COMMANDS[message.command]?.execute(message.data);
      },
      undefined,
      this.disposables
    );
  }
}
