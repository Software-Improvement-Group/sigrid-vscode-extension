import { window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { postActiveEditorChangedMessage } from "../utilities/editor";
import { getSigridConfiguration } from "../utilities/configuration";

export class InitializeCommand implements VsCodeCommand<undefined> {
    execute(data: VsCodeCommandData<undefined>): void {
        const { webview } = data;
        webview.postMessage({ command: "initialize", data: getSigridConfiguration() });
        postActiveEditorChangedMessage(webview, window.activeTextEditor);
    }
}
