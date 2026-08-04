import { existsSync } from "fs";
import { posix, win32 } from "path";
import { homedir } from "os";

export interface ExecutableLocation {
    path: string;
    /** True when the executable was found on PATH, meaning a terminal can run it by bare name. */
    onPath: boolean;
}

export interface FindExecutableDeps {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    exists?: (path: string) => boolean;
    home?: string;
}

/**
 * Locates a CLI without spawning a process, so it is safe to call from synchronous code.
 *
 * PATH is searched first: a hit there means an interactive terminal will resolve the bare name too.
 * Well-known install directories are probed afterwards, because a VS Code started from Finder or the
 * Dock inherits a truncated PATH that often misses Homebrew and user-local bin directories.
 */
export function findExecutable(name: string, deps: FindExecutableDeps = {}): ExecutableLocation | undefined {
    const platform = deps.platform ?? process.platform;
    const env = deps.env ?? process.env;
    const exists = deps.exists ?? existsSync;
    const home = deps.home ?? homedir();
    const candidateNames = buildCandidateNames(name, platform, env);
    // The host platform is irrelevant here: paths must be built the way the target platform reads them.
    const path = platform === 'win32' ? win32 : posix;

    const onPath = findInDirectories(splitPathVariable(env, platform), candidateNames, exists, path);
    if (onPath) {
        return { path: onPath, onPath: true };
    }

    const probed = findInDirectories(wellKnownDirectories(platform, env, home, path), candidateNames, exists, path);
    return probed ? { path: probed, onPath: false } : undefined;
}

/** On Windows an executable is only runnable with one of the PATHEXT suffixes. */
function buildCandidateNames(name: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string[] {
    if (platform !== 'win32') {
        return [name];
    }

    const extensions = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .map(extension => extension.trim())
        .filter(extension => extension.length > 0);

    return extensions.map(extension => name + extension.toLowerCase());
}

function splitPathVariable(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string[] {
    const separator = platform === 'win32' ? ';' : ':';
    return (env.PATH ?? env.Path ?? '').split(separator).filter(directory => directory.length > 0);
}

function wellKnownDirectories(platform: NodeJS.Platform, env: NodeJS.ProcessEnv, home: string, path: typeof posix): string[] {
    if (platform === 'win32') {
        return [
            path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'npm'),
            path.join(home, '.local', 'bin'),
            path.join(home, '.claude', 'local'),
        ];
    }

    return [
        path.join(home, '.claude', 'local'),
        path.join(home, '.local', 'bin'),
        '/opt/homebrew/bin',
        '/usr/local/bin',
        path.join(home, '.bun', 'bin'),
        path.join(home, '.volta', 'bin'),
    ];
}

function findInDirectories(directories: string[], candidateNames: string[], exists: (path: string) => boolean, path: typeof posix): string | undefined {
    for (const directory of directories) {
        for (const candidate of candidateNames) {
            const fullPath = path.join(directory, candidate);
            if (exists(fullPath)) {
                return fullPath;
            }
        }
    }
    return undefined;
}
