import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import ignore, { Ignore } from "ignore";
import { PassThrough } from "stream";

interface ZipContext {
    workspaceRoot: string;
    matcher: Ignore;
}

export async function createWorkspaceZip(workspaceRoot: string): Promise<Buffer> {
    const context: ZipContext = { workspaceRoot, matcher: loadGitignoreMatcher(workspaceRoot) };
    const files = collectFiles(workspaceRoot, context);
    return buildZipBuffer(workspaceRoot, files);
}

function loadGitignoreMatcher(workspaceRoot: string): Ignore {
    const matcher = ignore().add('.git');
    const gitignorePath = path.join(workspaceRoot, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
        matcher.add(fs.readFileSync(gitignorePath, 'utf8'));
    }

    return matcher;
}

function collectFiles(currentDir: string, context: ZipContext): string[] {
    const files: string[] = [];

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        const absolutePath = path.join(currentDir, entry.name);
        const relativePath = toRelativePath(context.workspaceRoot, absolutePath);

        if (isIgnored(context.matcher, relativePath, entry.isDirectory())) {
            continue;
        }

        if (entry.isDirectory()) {
            files.push(...collectFiles(absolutePath, context));
        } else if (entry.isFile()) {
            files.push(relativePath);
        }
    }

    return files;
}

function toRelativePath(workspaceRoot: string, absolutePath: string): string {
    return path.relative(workspaceRoot, absolutePath).split(path.sep).join('/');
}

function isIgnored(matcher: Ignore, relativePath: string, isDirectory: boolean): boolean {
    return matcher.ignores(isDirectory ? `${relativePath}/` : relativePath);
}

function buildZipBuffer(workspaceRoot: string, relativeFilePaths: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip');
        const passThrough = new PassThrough();
        const chunks: Buffer[] = [];

        passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));
        passThrough.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);

        archive.pipe(passThrough);
        for (const relativePath of relativeFilePaths) {
            archive.file(path.join(workspaceRoot, relativePath), { name: relativePath });
        }
        archive.finalize();
    });
}
