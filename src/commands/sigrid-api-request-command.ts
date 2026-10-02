import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { callSigridApi, SigridApiRequest } from "../utilities/sigrid-api-client";

export class SigridApiRequestCommand implements VsCodeCommand<SigridApiRequest> {
    async execute(data: VsCodeCommandData<SigridApiRequest>) {
        const response = await callSigridApi(data.payload, data.secrets);
        data.webview.postMessage({ command: 'sigridApiResponse', data: response });
    }
}
