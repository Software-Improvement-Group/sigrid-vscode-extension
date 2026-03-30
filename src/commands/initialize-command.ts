import { window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { EXTENSION_ID } from "../extension.config";
import { postActiveEditorChangedMessage } from "../utilities/editor";

export class InitializeCommand implements VsCodeCommand<undefined> {
    execute(data: VsCodeCommandData<undefined>): void {
        const { webview } = data;
        webview.postMessage({ command: "initialize", data: workspace.getConfiguration().get(EXTENSION_ID) });
        postActiveEditorChangedMessage(webview, window.activeTextEditor);
    }
}
