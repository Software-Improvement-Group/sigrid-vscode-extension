import { FixFinding } from "../commands/fix-findings-payload";

/**
 * Builds the prompt handed to an AI agent. This is the generic half of the integration: the same
 * prompt body goes to every agent, and only the lead instruction differs, depending on whether the
 * agent understands the Sigrid plugin's slash commands.
 */

/** Finding categories as set by the webview tabs. */
export const FindingCategory = {
    maintainability: 'Maintainability',
    security: 'Security',
    openSourceHealth: 'Open Source Health',
} as const;

const SLASH_COMMANDS: Record<string, string> = {
    [FindingCategory.maintainability]: '/sigrid:sigrid-improve autonomous',
    [FindingCategory.openSourceHealth]: '/sigrid:fix-osh-risk',
};

const PLAIN_INSTRUCTIONS: Record<string, string> = {
    [FindingCategory.maintainability]: 'Fix the following Sigrid maintainability findings.',
    [FindingCategory.security]: 'Fix the following Sigrid security findings.',
    [FindingCategory.openSourceHealth]: 'Remediate the following Sigrid open source health risks.',
};

const MIXED_INSTRUCTION = 'Fix the following Sigrid findings.';

const MCP_HINT = 'Note: the Sigrid MCP server was not detected in this environment. ' +
    'The findings above are self-contained, so work from them directly.';

export interface FixPromptOptions {
    supportsSlashCommands: boolean;
    mcpDetected: boolean;
}

export interface FixPromptContext {
    customer: string;
    system: string;
}

export interface FixPrompt {
    /** The opening instruction on its own, for adapters that cannot pass the full text verbatim. */
    readonly lead: string;
    /** The complete prompt, including the lead. */
    readonly text: string;
}

export function buildFixPrompt(findings: FixFinding[], context: FixPromptContext, options: FixPromptOptions): FixPrompt {
    const lead = buildLeadInstruction(findings, options.supportsSlashCommands);
    const sections = [lead, buildContextLine(context), buildFindingList(findings)];

    if (!options.mcpDetected) {
        sections.push(MCP_HINT);
    }

    return { lead, text: sections.filter(section => section.length > 0).join('\n\n') };
}

/**
 * Prefers a Sigrid skill when the agent supports slash commands and every finding belongs to a
 * category that has one. Security has no dedicated skill, so it always gets a plain instruction.
 */
function buildLeadInstruction(findings: FixFinding[], supportsSlashCommands: boolean): string {
    const category = getSingleCategory(findings);
    if (category === undefined) {
        return MIXED_INSTRUCTION;
    }

    const slashCommand = SLASH_COMMANDS[category];
    if (supportsSlashCommands && slashCommand) {
        return slashCommand;
    }

    return PLAIN_INSTRUCTIONS[category] ?? MIXED_INSTRUCTION;
}

/** The category shared by all findings, or undefined for an empty or mixed selection. */
function getSingleCategory(findings: FixFinding[]): string | undefined {
    const categories = new Set(findings.map(finding => finding.category));
    return categories.size === 1 ? categories.values().next().value : undefined;
}

function buildContextLine(context: FixPromptContext): string {
    const parts = [];
    if (context.customer) {
        parts.push(`Customer: ${context.customer}`);
    }
    if (context.system) {
        parts.push(`System: ${context.system}`);
    }
    return parts.join('   ');
}

function buildFindingList(findings: FixFinding[]): string {
    const lines = findings.map((finding, index) => formatFinding(finding, index + 1));
    return ['Findings (already diagnosed - do not re-run diagnosis):', ...lines].join('\n');
}

function formatFinding(finding: FixFinding, position: number): string {
    const header = `${position}. ${finding.category} / ${finding.severity} - ${finding.title}`;
    const locations = (finding.fileLocations ?? []).map(formatLocation).filter(location => location.length > 0);
    return locations.length > 0 ? `${header}\n   Locations: ${locations.join(', ')}` : header;
}

function formatLocation(location: { filePath: string; startLine?: number; endLine?: number }): string {
    if (!location.filePath) {
        return '';
    }
    if (location.startLine === undefined) {
        return location.filePath;
    }
    const lines = location.endLine !== undefined && location.endLine !== location.startLine
        ? `${location.startLine}-${location.endLine}`
        : `${location.startLine}`;
    return `${location.filePath}:${lines}`;
}
