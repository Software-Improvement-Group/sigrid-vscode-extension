import { window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { moveCursor } from "../utilities/editor";
import { VsCodeCommandData } from "./vscode-command-data";

export class FileOpenCommand implements VsCodeCommand<FileOpenPayload> {
    async execute(data: VsCodeCommandData<FileOpenPayload>) {
        const payload = data.payload;
        const { filePath } = payload;

        if (!filePath) {
            window.showErrorMessage("No file path provided to open.");
            return;
        }

        try {
            const files = await workspace.findFiles(`**/${filePath}`);
            if (files.length > 0) {
                const file = files[0];
                const document = await workspace.openTextDocument(file.path);
                await window.showTextDocument(document, {
                    preview: false // ensures it opens in a new tab, not preview mode
                });
                this.moveCursorToLine(payload.startLine || 1);

            }
        } catch (err) {
            window.showErrorMessage(`Error opening file: ${filePath})`);
        }
    }

    private moveCursorToLine(line: number) {
        const lineNumber = line > 0 ? line - 1 : 0; // Convert to zero-based index
        moveCursor(window.activeTextEditor!, lineNumber);
    }
}

interface FileOpenPayload {
    filePath: string;
    startLine?: number;
    endLine?: number;
}
