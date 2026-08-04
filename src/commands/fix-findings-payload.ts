/** Mirrors the webview `SelectedFinding` model. */
export interface FixFinding {
    id: string;
    category: string;
    title: string;
    severity: string;
    fileLocations: { filePath: string; startLine?: number; endLine?: number }[];
}

export interface FixFindingsPayload {
    agentId: string;
    findings: FixFinding[];
}
