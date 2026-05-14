import { window, Uri } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";
import { getSigridConfiguration } from "../utilities/configuration";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp } from "../extension.config";

export class InitializeCommand implements VsCodeCommand<undefined> {
    execute(data: VsCodeCommandData<undefined>): void {
        const { webview, extensionUri } = data;
        webview.postMessage({ command: "initialize", data: getSigridConfiguration() });
        const baseUri = getWebviewUri(webview, extensionUri, AngularApp.outputFolder);
        webview.postMessage({ command: "webviewBaseUri", data: baseUri.toString() });
        postActiveEditorChangedMessage(webview, window.activeTextEditor);
    }
}
