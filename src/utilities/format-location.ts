interface FileLocation {
    filePath: string;
    startLine?: number;
}

export function formatLocation(loc: FileLocation): string {
    const lineInfo = loc.startLine ? `:${loc.startLine}` : '';
    return `${loc.filePath}${lineInfo}`;
}
