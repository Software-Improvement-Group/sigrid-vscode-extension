import { window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";

export class FileOpenCommand implements VsCodeCommand<FileOpenPayload> {
    async execute(payload: FileOpenPayload) {
        const { filePath } = payload;

        try {
            const files = await workspace.findFiles(`**/${filePath}`);
            if (files.length > 0) {
                const file = files[0];
                const document = await workspace.openTextDocument(file.path);
                await window.showTextDocument(document, {
                    preview: false // ensures it opens in a new tab, not preview mode
                });
            }
        } catch (err) {
            window.showErrorMessage(`Error opening file: ${filePath})`);
        }
    }
}

interface FileOpenPayload {
    filePath: string;
    startLine?: number;
    endLine?: number;
}
