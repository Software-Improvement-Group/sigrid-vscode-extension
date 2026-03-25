import { TabInputText, Uri, ViewColumn, window, workspace } from "vscode";
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
                    viewColumn: this.getViewColumn(file.path),
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

    private getViewColumn(path: string) {
        // File is opened already in some column, return that column to focus it
        const fileColumn = this.getFileViewColumn(path);
        if (fileColumn) {
            return fileColumn;
        }

        // Otherwise, open in the first non-webview column or default to One
        const nonWebviewGroup = window.tabGroups.all.find(g =>
            g.tabs.some(t => t.input && t.input instanceof TabInputText));
        return nonWebviewGroup ? nonWebviewGroup.viewColumn : ViewColumn.One;
    }

    private getFileViewColumn(path: string) {
        const panel = window.tabGroups.all.find(g =>
            g.tabs.some(t => t.input instanceof TabInputText && t.input.uri.path === path));
        return panel?.viewColumn;
    }
}

interface FileOpenPayload {
    filePath: string;
    startLine?: number;
    endLine?: number;
}
