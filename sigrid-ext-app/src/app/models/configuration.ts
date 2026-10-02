export interface Configuration {
  hasApiKey: boolean;
  customer: string;
  system: string;
  subsystem: string;
  sigridUrl: string;
  jiraBaseUrl: string;
  jiraUser: string;
  hasJiraToken: boolean;
  jiraProjectKey: string;
  azureDevOpsOrganizationUrl: string;
  hasAzureDevOpsToken: boolean;
  azureDevOpsProjectName: string;
}
