import { Position, Range, Selection, TextEditor, Webview } from "vscode";
import { getRelativePath } from "./workspace";

export function moveCursor(editor: TextEditor, line: number, column: number = 0) {
    if (!editor || line < 0) {
        return;
    }

    const position = new Position(line, column);
    editor.selection = new Selection(position, position);

    // Scroll to the new position
    editor.revealRange(new Range(position, position));
}

export function postActiveEditorChangedMessage(webview: Webview, editor: TextEditor | undefined) {
    if (editor) {
        const fullPath = editor.document.uri.fsPath;
        if (fullPath) {
            webview.postMessage({ command: "activeEditorChanged", data: { filePath: getRelativePath(fullPath) } });
        }
    }
}
