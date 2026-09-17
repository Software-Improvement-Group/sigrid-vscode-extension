import { env, Uri } from "vscode";

const ALLOWED_SCHEMES = ["http", "https"];

export function parseExternalUrl(url: string): Uri {
    const uri = Uri.parse(url, true);
    if (!ALLOWED_SCHEMES.includes(uri.scheme)) {
        throw new Error(`Unsupported URL scheme "${uri.scheme}:". Only http/https URLs may be opened.`);
    }
    return uri;
}

export async function openExternalUrl(url: string): Promise<boolean> {
    return env.openExternal(parseExternalUrl(url));
}
