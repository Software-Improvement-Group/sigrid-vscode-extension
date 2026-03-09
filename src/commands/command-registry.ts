import { FileOpenCommand } from "./file-open-command";
import { MessageCommand } from "./message-command";
import { UrlOpenCommand } from "./url-open-command";
import { VsCodeCommand } from "./vscode-command";

export const COMMANDS: Record<string, VsCodeCommand<unknown>> = {
    showMessage: new MessageCommand(),
    openFile: new FileOpenCommand(),
    openUrl: new UrlOpenCommand(),
};
