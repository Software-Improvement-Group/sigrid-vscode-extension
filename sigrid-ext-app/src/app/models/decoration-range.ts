export interface DecorationRange {
  startLine: number;
  endLine: number;
  description: string;
  href: string;
}

export interface DecorationUpdatePayload {
  filePath: string;
  ranges: DecorationRange[];
}
