import { VsCodeCommandData } from "./vscode-command-data";

export interface VsCodeCommand<T> {
    execute(data: VsCodeCommandData<T>): void;
}
