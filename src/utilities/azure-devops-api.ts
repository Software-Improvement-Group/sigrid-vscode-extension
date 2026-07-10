const AZURE_DEVOPS_API_VERSION = '7.1';

export function buildAzureDevOpsWitUrl(organizationUrl: string, projectName: string, path: string): string {
    return `${organizationUrl}/${encodeURIComponent(projectName)}/_apis/wit/${path}?api-version=${AZURE_DEVOPS_API_VERSION}`;
}
