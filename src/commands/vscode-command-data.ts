import { Uri, Webview } from "vscode";

export class VsCodeCommandData<T> {
    webview: Webview;
    extensionUri: Uri;
    payload: T;

    constructor(webview: Webview, extensionUri: Uri, payload: T) {
        this.webview = webview;
        this.extensionUri = extensionUri;
        this.payload = payload;
    }
}
