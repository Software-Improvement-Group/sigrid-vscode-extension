import { SecretStorage, Uri, Webview } from "vscode";

export class VsCodeCommandData<T> {
    webview: Webview;
    extensionUri: Uri;
    payload: T;
    secrets: SecretStorage;

    constructor(webview: Webview, extensionUri: Uri, payload: T, secrets: SecretStorage) {
        this.webview = webview;
        this.extensionUri = extensionUri;
        this.payload = payload;
        this.secrets = secrets;
    }
}
