import { window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { openExternalUrl } from "../utilities/url-validation";

export class UrlOpenCommand implements VsCodeCommand<string> {
    async execute(data: VsCodeCommandData<string>) {
        const url = data.payload;

        if (!url) {
            window.showErrorMessage("No URL provided to open.");
            return;
        }

        try {
            await openExternalUrl(url);
        } catch (err) {
            window.showErrorMessage(`Invalid URL: ${url}`);
        }
    }
}
