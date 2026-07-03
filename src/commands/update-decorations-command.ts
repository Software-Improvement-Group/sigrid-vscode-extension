import { MarkdownString, Range, window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { getRelativePath } from "../utilities/workspace";
import { refactoringCandidateDecorationType } from "../utilities/decorations";

export class UpdateDecorationsCommand implements VsCodeCommand<DecorationUpdatePayload> {
    execute(data: VsCodeCommandData<DecorationUpdatePayload>): void {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const activeRelativePath = getRelativePath(editor.document.uri.fsPath).replaceAll('\\', '/');
        if (activeRelativePath !== data.payload.filePath) {
            return;
        }

        const decorations = data.payload.ranges.map(range => {
            const startLine = Math.max(0, range.startLine - 1);
            const endLine = Math.max(startLine, range.endLine - 1);
            const lines = [range.description];
            if (range.href) {
                lines.push(`[View in Sigrid](${range.href})`);
            }
            return {
                range: new Range(startLine, 0, endLine, 0),
                hoverMessage: new MarkdownString(lines.join('\n\n')),
            };
        });

        editor.setDecorations(refactoringCandidateDecorationType, decorations);
    }
}

interface DecorationRange {
    startLine: number;
    endLine: number;
    description: string;
    href: string;
}

interface DecorationUpdatePayload {
    filePath: string;
    ranges: DecorationRange[];
}
