import { FileOpenCommand } from "./file-open-command";
import { InitializeCommand } from "./initialize-command";
import { MessageCommand } from "./message-command";
import { UrlOpenCommand } from "./url-open-command";
import { UsageStatisticsCommand } from "./usage-statistics-command";
import { CreateJiraIssueCommand } from "./create-jira-issue-command";
import { CreateAzureDevOpsWorkItemCommand } from "./create-azure-devops-work-item-command";
import { GetAzureDevOpsWorkItemTypesCommand } from "./get-azure-devops-work-item-types-command";
import { FixFindingsWithAiCommand } from "./fix-findings-with-ai-command";
import { VsCodeCommand } from "./vscode-command";

export const COMMANDS: Record<string, VsCodeCommand<unknown>> = {
    initialize: new InitializeCommand(),
    showMessage: new MessageCommand(),
    openFile: new FileOpenCommand(),
    openUrl: new UrlOpenCommand(),
    sendUsageStatistics: new UsageStatisticsCommand(),
    createJiraIssue: new CreateJiraIssueCommand(),
    createAzureDevOpsWorkItem: new CreateAzureDevOpsWorkItemCommand(),
    getAzureDevOpsWorkItemTypes: new GetAzureDevOpsWorkItemTypesCommand(),
    fixFindingsWithAi: new FixFindingsWithAiCommand(),
};
