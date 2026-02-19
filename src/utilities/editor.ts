import { Position, Range, Selection, TextEditor, window } from "vscode";

export function moveCursor(editor: TextEditor, line: number, column: number = 0) {
        if (!editor || line < 0) {
            return;
        }

        const position = new Position(line, column);
        editor.selection = new Selection(position, position);

        // Scroll to the new position
        editor.revealRange(new Range(position, position));
    }