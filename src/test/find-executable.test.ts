import * as assert from 'assert';
import { findExecutable } from '../utilities/find-executable';

const HOME = '/Users/tester';

function existsOnly(...paths: string[]) {
    return (path: string) => paths.includes(path);
}

suite('findExecutable', () => {
    test('finds an executable on PATH and reports it as runnable by bare name', () => {
        const found = findExecutable('claude', {
            platform: 'darwin',
            env: { PATH: '/usr/bin:/opt/homebrew/bin' },
            exists: existsOnly('/opt/homebrew/bin/claude'),
            home: HOME,
        });

        assert.deepStrictEqual(found, { path: '/opt/homebrew/bin/claude', onPath: true });
    });

    test('probes well-known directories when PATH is truncated', () => {
        const found = findExecutable('claude', {
            platform: 'darwin',
            // A VS Code started from the Dock sees a PATH like this one.
            env: { PATH: '/usr/bin:/bin' },
            exists: existsOnly('/opt/homebrew/bin/claude'),
            home: HOME,
        });

        assert.deepStrictEqual(found, { path: '/opt/homebrew/bin/claude', onPath: false });
    });

    test('finds the local Claude Code install directory', () => {
        const found = findExecutable('claude', {
            platform: 'darwin',
            env: { PATH: '' },
            exists: existsOnly(`${HOME}/.claude/local/claude`),
            home: HOME,
        });

        assert.deepStrictEqual(found, { path: `${HOME}/.claude/local/claude`, onPath: false });
    });

    test('prefers PATH over the well-known directories', () => {
        const found = findExecutable('claude', {
            platform: 'darwin',
            env: { PATH: '/custom/bin' },
            exists: existsOnly('/custom/bin/claude', '/usr/local/bin/claude'),
            home: HOME,
        });

        assert.deepStrictEqual(found, { path: '/custom/bin/claude', onPath: true });
    });

    test('applies PATHEXT on Windows', () => {
        const found = findExecutable('claude', {
            platform: 'win32',
            env: { PATH: 'C:\\tools', PATHEXT: '.COM;.EXE;.CMD' },
            exists: existsOnly('C:\\tools\\claude.cmd'),
            home: 'C:\\Users\\tester',
        });

        assert.deepStrictEqual(found, { path: 'C:\\tools\\claude.cmd', onPath: true });
    });

    test('does not match an extensionless file on Windows', () => {
        const found = findExecutable('claude', {
            platform: 'win32',
            env: { PATH: 'C:\\tools', PATHEXT: '.EXE;.CMD' },
            exists: existsOnly('C:\\tools\\claude'),
            home: 'C:\\Users\\tester',
        });

        assert.strictEqual(found, undefined);
    });

    test('returns undefined when the executable is nowhere to be found', () => {
        const found = findExecutable('claude', {
            platform: 'darwin',
            env: { PATH: '/usr/bin:/bin' },
            exists: () => false,
            home: HOME,
        });

        assert.strictEqual(found, undefined);
    });
});
