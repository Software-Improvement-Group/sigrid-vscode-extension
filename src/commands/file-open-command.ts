import { Uri, window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { moveCursor } from "../utilities/editor";
import { resolveWorkspaceFile } from "../utilities/workspace";
import { VsCodeCommandData } from "./vscode-command-data";

export class FileOpenCommand implements VsCodeCommand<FileOpenPayload> {
    async execute(data: VsCodeCommandData<FileOpenPayload>) {
        const { filePath, startLine } = data.payload;
        if (!filePath) {
            window.showErrorMessage("No file path provided to open.");
            return;
        }

        const uri = resolveWorkspaceFile(filePath);
        if (!uri) {
            window.showErrorMessage(`Error opening file: ${filePath})`);
            return;
        }

        try {
            await this.openFile(uri, startLine || 1);
        } catch (err) {
            window.showErrorMessage(`Error opening file: ${filePath})`);
        }
    }

    private async openFile(uri: Uri, startLine: number) {
        await workspace.fs.stat(uri);
        const document = await workspace.openTextDocument(uri);
        await window.showTextDocument(document, {
            preview: false // ensures it opens in a new tab, not preview mode
        });
        this.moveCursorToLine(startLine);
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
