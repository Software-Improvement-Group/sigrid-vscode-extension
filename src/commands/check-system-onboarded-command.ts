import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { getSigridConfiguration } from "../utilities/configuration";
import { buildBearerAuthHeader, buildSigridCiUrl } from "../utilities/sigrid-ci-api";

export type SystemOnboardStatus = 'onboarded' | 'not-onboarded' | 'error';

export interface SystemOnboardStatusResult {
    status: SystemOnboardStatus;
    message?: string;
}

export class CheckSystemOnboardedCommand implements VsCodeCommand<void> {
    async execute(data: VsCodeCommandData<void>) {
        const config = getSigridConfiguration();
        const url = buildSigridCiUrl(config.sigridUrl, config.customer, config.system);
        const result = await this.checkStatus(url, config.apiKey);
        data.webview.postMessage({ command: 'systemOnboardStatus', data: result });
    }

    private async checkStatus(url: string, apiKey: string): Promise<SystemOnboardStatusResult> {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': buildBearerAuthHeader(apiKey) },
            });
            return this.toResult(response, await this.readErrorBodyIfNeeded(response));
        } catch (error) {
            console.error('Failed to check whether the system is onboarded:', error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    }

    private async readErrorBodyIfNeeded(response: Response): Promise<string | undefined> {
        return response.ok || response.status === 404 ? undefined : await response.text();
    }

    private toResult(response: Response, errorBody: string | undefined): SystemOnboardStatusResult {
        if (response.ok) {
            return { status: 'onboarded' };
        }
        if (response.status === 404) {
            return { status: 'not-onboarded' };
        }

        console.error('Sigrid CI existence check failed:', response.status, errorBody);
        return { status: 'error', message: `Unexpected response (${response.status}) while checking if the system is onboarded.` };
    }
}
