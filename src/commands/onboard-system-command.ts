import { window, workspace } from "vscode";
import { VsCodeCommand } from "./vscode-command";
import { VsCodeCommandData } from "./vscode-command-data";
import { getSigridConfiguration } from "../utilities/configuration";
import { buildBearerAuthHeader, buildCiUploadUrl, buildLicensesUrl } from "../utilities/sigrid-ci-api";
import { createWorkspaceZip } from "../utilities/zip-workspace";

const VALID_CAPABILITIES = ['MAINTAINABILITY', 'SECURITY', 'OPEN_SOURCE_HEALTH'];

interface LicensesResponse {
    licenses: string[];
}

interface OnboardResponse {
    uploadUrl: string;
}

interface OnboardingRequest {
    capabilities: string[];
    subsystem: string;
}

export class OnboardSystemCommand implements VsCodeCommand<void> {
    async execute(data: VsCodeCommandData<void>) {
        try {
            await this.onboard();
            data.webview.postMessage({ command: 'onboardSystemResult', data: { success: true } });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to onboard the system:', error);
            window.showErrorMessage(`Failed to onboard the system to Sigrid: ${message}`);
            data.webview.postMessage({ command: 'onboardSystemResult', data: { success: false, error: message } });
        }
    }

    private async onboard(): Promise<void> {
        const config = getSigridConfiguration();
        const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder is open.');
        }

        const authHeader = buildBearerAuthHeader(config.apiKey);
        const licensesUrl = buildLicensesUrl(config.sigridUrl, config.customer);
        const capabilities = await this.fetchCapabilities(licensesUrl, authHeader);

        const uploadRequestUrl = buildCiUploadUrl(config.sigridUrl, config.customer, config.system);
        const uploadUrl = await this.requestOnboarding(uploadRequestUrl, authHeader, { capabilities, subsystem: config.subsystem });

        const zip = await createWorkspaceZip(workspaceRoot);
        await this.uploadZip(uploadUrl, zip);
    }

    private async fetchCapabilities(licensesUrl: string, authHeader: string): Promise<string[]> {
        const response = await fetch(licensesUrl, {
            headers: { 'Authorization': authHeader },
        });

        if (!response.ok) {
            throw new Error(`Could not retrieve license information (${response.status}).`);
        }

        const result = await response.json() as LicensesResponse;
        return result.licenses.filter(license => VALID_CAPABILITIES.includes(license));
    }

    private async requestOnboarding(uploadRequestUrl: string, authHeader: string, request: OnboardingRequest): Promise<string> {
        const response = await fetch(uploadRequestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                mode: 'ONBOARDING',
                capabilities: request.capabilities,
                subsystem: request.subsystem || null,
                convert: null,
            }),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Onboarding request failed (${response.status}): ${body.substring(0, 200)}`);
        }

        const result = await response.json() as OnboardResponse;
        return result.uploadUrl;
    }

    private async uploadZip(uploadUrl: string, zip: Buffer): Promise<void> {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/zip',
                'Content-Length': String(zip.byteLength),
                'x-amz-server-side-encryption': 'AES256',
            },
            body: zip,
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Failed to upload the source code archive (${response.status}): ${body.substring(0, 200)}`);
        }
    }
}
