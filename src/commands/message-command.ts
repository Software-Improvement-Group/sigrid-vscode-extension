import { window } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";

export class MessageCommand implements VsCodeCommand<MessagePayload> {
    execute(data: VsCodeCommandData<MessagePayload>) {
        const payload = data.payload;
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
