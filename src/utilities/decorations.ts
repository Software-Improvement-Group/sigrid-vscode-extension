import { OverviewRulerLane, ThemeColor, window } from "vscode";

export const refactoringCandidateDecorationType = window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: new ThemeColor('editor.rangeHighlightBackground'),
    overviewRulerColor: new ThemeColor('editorOverviewRuler.warningForeground'),
    overviewRulerLane: OverviewRulerLane.Right,
});
