'use strict';

/**
 * The extension host (`src/`) and the webview (`sigrid-ext-app/`) are separate TypeScript
 * projects with no shared source, so a few small models are hand-mirrored between them,
 * documented only by a "keep in sync" comment. This script fails loudly when they drift,
 * since the compiler cannot catch it across the project boundary.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readFile(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/** Everything between the first `{` after `anchor` and its matching `}`. */
function extractBlock(source, anchor) {
    const anchorIndex = source.indexOf(anchor);
    if (anchorIndex === -1) {
        throw new Error(`Could not find "${anchor}"`);
    }
    const start = source.indexOf('{', anchorIndex) + 1;
    let depth = 1;
    let i = start;
    while (depth > 0 && i < source.length) {
        if (source[i] === '{') { depth++; }
        else if (source[i] === '}') { depth--; }
        i++;
    }
    return source.slice(start, i - 1);
}

/** Strips comments and blank lines, one trimmed statement per entry. */
function statements(block) {
    return block
        .split('\n')
        .map(line => line.replace(/\/\/.*$/, '').trim())
        .filter(Boolean);
}

/** `key: value` pairs (e.g. the `FindingCategory` string map), compared by their literal value. */
function objectLiteralEntries(block) {
    return statements(block)
        .map(line => line.match(/^(\w+)\s*:\s*(.+?),?$/))
        .filter(Boolean)
        .map(match => `${match[1]}=${match[2].replace(/,$/, '')}`)
        .sort();
}

/** Field names only (ignoring types), for interfaces mirrored across the two projects. */
function fieldNames(block) {
    return statements(block)
        .map(line => line.match(/^(\w+)\??\s*:/))
        .filter(Boolean)
        .map(match => match[1])
        .sort();
}

function assertEqual(label, actual, expected) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        throw new Error(`${label} differ:\n  extension host: ${e}\n  webview:        ${a}`);
    }
}

function checkFindingCategory() {
    const host = extractBlock(readFile('src/ai-agents/fix-prompt-builder.ts'), 'export const FindingCategory =');
    const webview = extractBlock(readFile('sigrid-ext-app/src/app/models/finding-category.ts'), 'export const FindingCategory =');
    assertEqual('FindingCategory', objectLiteralEntries(webview), objectLiteralEntries(host));
}

function checkAvailableAgent() {
    const host = extractBlock(readFile('src/ai-agents/ai-agent-provider.ts'), 'export interface AvailableAgent');
    const webview = extractBlock(readFile('sigrid-ext-app/src/app/models/available-agent.ts'), 'export interface AvailableAgent');
    assertEqual('AvailableAgent fields', fieldNames(webview), fieldNames(host));
}

function checkFixFindingsPayload() {
    const hostFile = readFile('src/commands/fix-findings-payload.ts');
    const hostPayload = extractBlock(hostFile, 'export interface FixFindingsPayload');
    const hostFinding = extractBlock(hostFile, 'export interface FixFinding');

    const webviewPayload = extractBlock(readFile('sigrid-ext-app/src/app/models/fix-findings-payload.ts'), 'export interface FixFindingsPayload');
    const webviewFinding = extractBlock(readFile('sigrid-ext-app/src/app/models/selected-finding.ts'), 'export interface SelectedFinding');

    assertEqual('FixFindingsPayload fields', fieldNames(webviewPayload), fieldNames(hostPayload));
    assertEqual('FixFinding/SelectedFinding fields', fieldNames(webviewFinding), fieldNames(hostFinding));
}

const checks = [checkFindingCategory, checkAvailableAgent, checkFixFindingsPayload];
const failures = checks
    .map(check => {
        try {
            check();
            return null;
        } catch (error) {
            return `${check.name}: ${error.message}`;
        }
    })
    .filter(Boolean);

if (failures.length > 0) {
    console.error('Mirrored types between src/ and sigrid-ext-app/ have drifted:\n');
    failures.forEach(failure => console.error(failure + '\n'));
    process.exit(1);
}

console.log('Mirrored types between src/ and sigrid-ext-app/ are in sync.');
