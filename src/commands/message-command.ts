import { window } from "vscode";
import { VsCodeCommand } from "./vscode-command";

export class MessageCommand implements VsCodeCommand<MessagePayload> {
    execute(payload: MessagePayload) {
        const { text, severity } = payload;
        switch (severity) {
            case 'info':
                window.showInformationMessage(text);
                return;
            case 'warning':
                window.showWarningMessage(text);
                return;
            case 'error':
                window.showErrorMessage(text);
                return;
        }
    }
}

interface MessagePayload {
    text: string;
    severity: 'info' | 'warning' | 'error';
}
