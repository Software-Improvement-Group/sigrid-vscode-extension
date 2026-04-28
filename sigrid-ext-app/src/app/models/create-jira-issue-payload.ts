export interface CreateJiraIssuePayload {
  title: string;
  findings: JiraFinding[];
  sigridUrl: string;
}

export interface JiraFinding {
  emoji: string;
  title: string;
  fileLocations: { filePath: string; startLine?: number }[];
}
