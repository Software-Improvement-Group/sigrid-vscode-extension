import { env, Uri, window } from "vscode";
import { VsCodeCommand } from "./vscode-command";

export class UrlOpenCommand implements VsCodeCommand<string> {
    execute(url: string) {
        if (url) {
            try {
                const uri = Uri.parse(url);
                env.openExternal(uri);
            } catch (err) {
                window.showErrorMessage(`Invalid URL: ${url}`);
            }
        } else {
            window.showErrorMessage("No URL provided to open.");
        }
    }
}
