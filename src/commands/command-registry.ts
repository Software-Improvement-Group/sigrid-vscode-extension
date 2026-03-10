import { FileOpenCommand } from "./file-open-command";
import { InitializeCommand } from "./initialize-command";
import { MessageCommand } from "./message-command";
import { UrlOpenCommand } from "./url-open-command";
import { UsageStatisticsCommand } from "./usage-statistics-command";
import { VsCodeCommand } from "./vscode-command";

export const COMMANDS: Record<string, VsCodeCommand<unknown>> = {
    initialize: new InitializeCommand(),
    showMessage: new MessageCommand(),
    openFile: new FileOpenCommand(),
    openUrl: new UrlOpenCommand(),
    sendUsageStatistics: new UsageStatisticsCommand(),
};
