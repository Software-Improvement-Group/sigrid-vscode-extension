import { Webview } from "vscode";

export class VsCodeCommandData<T> {
    webview: Webview;
    payload: T;

    constructor(webview: Webview, payload: T) {
        this.webview = webview;
        this.payload = payload;
    }
}
