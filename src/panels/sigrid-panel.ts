import { Disposable, extensions, SecretStorage, Uri, Webview, WebviewView, WebviewViewProvider, window, workspace } from "vscode";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp, EXTENSION_ID } from "../extension.config";
import { getNonce } from "../utilities/get-nonce";
import { VsCodeCommandEvent } from "../commands/vscode-command-event";
import { COMMANDS } from "../commands/command-registry";
import { VsCodeCommandData } from "../commands/vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";
import { getSigridConfiguration, getSigridWebviewConfiguration } from "../utilities/configuration";
import { postAiAgentsDetectedMessage } from "../utilities/ai-agents-message";
import { invalidateAvailability } from "../ai-agents/ai-agent-registry";
import { SECRET_KEYS } from "../utilities/secrets";
import { getRelevantKeys } from "../utilities/scoped-secrets";

export class SigridPanel implements WebviewViewProvider {
  private disposables: Disposable[] = [];

  constructor(private readonly extensionUri: Uri, private readonly secrets: SecretStorage) {}

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

    // Use a nonce to whitelist which scripts/styles can be run
    const nonce = getNonce();
    const csp = this.getContentSecurityPolicy(webview, nonce);

    return this.renderHtml({ styleUri: styleUri.toString(), scriptUri: scriptUri.toString(), nonce, csp });
  }

  private getContentSecurityPolicy(webview: Webview, nonce: string) {
    const sigridApiHost = new URL(getSigridConfiguration().sigridUrl).origin;
    return `default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} data: https:; font-src ${webview.cspSource}; connect-src ${webview.cspSource} ${sigridApiHost}`;
  }

  private renderHtml({ styleUri, scriptUri, nonce, csp }: { styleUri: string; scriptUri: string; nonce: string; csp: string }) {
    return /*html*/`
        <!doctype html>
        <html lang="en" data-beasties-container>
        <head>
          <meta charset="utf-8">
          <title>Sigrid</title>
          <base href="./">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <meta name="csp-nonce" content="${nonce}">
          <link rel="stylesheet" href="${styleUri}" nonce="${nonce}">
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
        try {
          const result = COMMANDS[message.command]?.execute(new VsCodeCommandData(webview, this.extensionUri, message.data, this.secrets));
          Promise.resolve(result).catch(error => console.error(`Command "${message.command}" failed:`, error));
        } catch (error) {
          console.error(`Command "${message.command}" failed:`, error);
        }
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
    const postConfiguration = () => this.postConfiguration(webview);

    workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(EXTENSION_ID)) {
        postConfiguration();
      }
    }, undefined, this.disposables);

    this.secrets.onDidChange(event => {
      if (this.isTrackedSecretKey(event.key)) {
        postConfiguration();
      }
    }, undefined, this.disposables);

    workspace.onDidChangeWorkspaceFolders(postConfiguration, undefined, this.disposables);
  }

  private async postConfiguration(webview: Webview) {
    const newConfig = await getSigridWebviewConfiguration(this.secrets);
    webview.postMessage({ command: "configurationChanged", data: newConfig });
  }

  private isTrackedSecretKey(key: string): boolean {
    return Object.values(SECRET_KEYS).flatMap(getRelevantKeys).includes(key);
  }

  /**
   * Re-detects the available AI agents. Installing/uninstalling an extension is the only event
   * that can actually change the result, so only that invalidates the providers' cached lookups;
   * the panel becoming visible again just re-reports the still-cached availability to the webview.
   */
  private setAgentDetectionListeners(webviewView: WebviewView) {
    const webview = webviewView.webview;
    const redetect = () => postAiAgentsDetectedMessage(webview);

    extensions.onDidChange(() => {
      invalidateAvailability();
      redetect();
    }, undefined, this.disposables);
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
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
