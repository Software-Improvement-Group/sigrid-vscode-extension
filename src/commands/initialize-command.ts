import { window, Uri } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";
import { getSigridWebviewConfiguration } from "../utilities/configuration";
import { getWebviewUri } from "../utilities/get-webview-uri";
import { AngularApp } from "../extension.config";
import { postAiAgentsDetectedMessage } from "../utilities/ai-agents-message";

export class InitializeCommand implements VsCodeCommand<undefined> {
    async execute(data: VsCodeCommandData<undefined>): Promise<void> {
        const { webview, extensionUri, secrets } = data;
        webview.postMessage({ command: "initialize", data: await getSigridWebviewConfiguration(secrets) });
        const baseUri = getWebviewUri(webview, extensionUri, AngularApp.outputFolder);
        webview.postMessage({ command: "webviewBaseUri", data: baseUri.toString() });
        postActiveEditorChangedMessage(webview, window.activeTextEditor);
        postAiAgentsDetectedMessage(webview);
    }
}
