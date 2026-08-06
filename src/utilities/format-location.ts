interface FileLocation {
    filePath: string;
    startLine?: number;
    endLine?: number;
}

export function formatLocation(loc: FileLocation): string {
    if (!loc.filePath) {
        return '';
    }
    if (!loc.startLine) {
        return loc.filePath;
    }
    const lines = loc.endLine && loc.endLine !== loc.startLine
        ? `${loc.startLine}-${loc.endLine}`
        : `${loc.startLine}`;
    return `${loc.filePath}:${lines}`;
}
