import { workspace } from "vscode";
import { EXTENSION_ID } from "../extension.config";

export function getSigridConfiguration() {
    const config = workspace.getConfiguration(EXTENSION_ID);
    return {
        apiKey: config.get<string>('apiKey', ''),
        customer: config.get<string>('customer', ''),
        system: config.get<string>('system', ''),
        subsystem: config.get<string>('subsystem', ''),
        sigridUrl: config.get<string>('sigridUrl', 'https://sigrid-says.com'),
        jiraBaseUrl: config.get<string>('jiraBaseUrl', ''),
        jiraUser: config.get<string>('jiraUser', ''),
        jiraToken: config.get<string>('jiraToken', ''),
        jiraProjectKey: config.get<string>('jiraProjectKey', ''),
    };
}
