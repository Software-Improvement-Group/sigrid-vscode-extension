export interface IssueFinding {
    emoji: string;
    title: string;
    fileLocations: { filePath: string; startLine?: number }[];
}
