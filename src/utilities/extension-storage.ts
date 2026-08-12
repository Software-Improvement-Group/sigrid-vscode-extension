import { Uri, workspace } from "vscode";

const PROMPT_FOLDER = 'fix-prompts';

let storageUri: Uri | undefined;

/** Called once from `activate`, so the rest of the extension can reach storage without the context. */
export function setStorageUri(uri: Uri) {
    storageUri = uri;
}

/** The extension's global storage directory, or undefined before `activate` ran (tests). */
export function getStorageUri(): Uri | undefined {
    return storageUri;
}

/**
 * Directory holding the prompt files handed to CLI agents. Inside the extension's global storage
 * rather than the system temp directory, because the prompts contain customer and system names.
 */
export function getPromptStorageUri(): Uri {
    if (!storageUri) {
        throw new Error('Extension storage has not been initialized.');
    }
    return Uri.joinPath(storageUri, PROMPT_FOLDER);
}

/**
 * Removes prompt files from earlier sessions. Best-effort: a prompt the user never ran is worthless
 * once the window is gone, but failing to clean up must never break a handoff.
 */
export async function clearStalePromptFiles() {
    try {
        const directory = getPromptStorageUri();
        const entries = await workspace.fs.readDirectory(directory);
        await Promise.all(entries.map(([name]) => workspace.fs.delete(Uri.joinPath(directory, name))));
    } catch {
        // No directory yet, or nothing we can do about it.
    }
}
