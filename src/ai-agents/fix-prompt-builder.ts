import { FixFinding } from "../commands/fix-findings-payload";
import { formatLocation } from "../utilities/format-location";
import { SIGRID_TOOL_NAMES } from "./sigrid-mcp-detection";

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

/**
 * The Sigrid MCP tools worth naming per category. Read only on purpose: the agent must never record
 * anything back to Sigrid, least of all on top of an edit the user has not reviewed yet.
 */
const MCP_TOOLS: Record<string, string[]> = {
    [FindingCategory.maintainability]: [SIGRID_TOOL_NAMES.maintainabilityGetFindings, SIGRID_TOOL_NAMES.guardrailsQualityCheck],
    [FindingCategory.security]: [SIGRID_TOOL_NAMES.securityGetFindings, SIGRID_TOOL_NAMES.guardrailsQualityCheck],
    [FindingCategory.openSourceHealth]: [SIGRID_TOOL_NAMES.opensourcehealthGetRisks, SIGRID_TOOL_NAMES.opensourcehealthGetVulnerabilities],
};

const GUARDRAILS_TOOL = SIGRID_TOOL_NAMES.guardrailsQualityCheck;

export interface FixPromptOptions {
    supportsSlashCommands: boolean;
    mcpDetected: boolean;
    /** Renders a tool name the way the agent links tools (`#name`), or undefined if it cannot. */
    resolveToolReference?: (toolName: string) => string | undefined;
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
    } else if (!isSlashCommand(lead)) {
        // A Sigrid skill already orchestrates MCP, so instructions of our own would only fight it.
        sections.push(buildMcpInstruction(mcpToolsFor(findings), options.resolveToolReference));
    }

    return { lead, text: sections.filter(section => section.length > 0).join('\n\n') };
}

function isSlashCommand(lead: string): boolean {
    return lead.startsWith('/');
}

/** The tools relevant to the selection, in category order and without repeats. */
function mcpToolsFor(findings: FixFinding[]): string[] {
    const categories = new Set(findings.map(finding => finding.category));
    const tools = [...categories].flatMap(category => MCP_TOOLS[category] ?? []);
    return [...new Set(tools)];
}

/**
 * Tells the agent that Sigrid itself is reachable. Without this the agent has no reason to call a
 * Sigrid tool: the finding list alone reads as everything it needs to know.
 */
function buildMcpInstruction(tools: string[], resolveToolReference?: (toolName: string) => string | undefined): string {
    if (tools.length === 0) {
        return '';
    }

    const reference = (tool: string) => resolveToolReference?.(tool) ?? tool;
    const queryTools = tools.filter(tool => tool !== GUARDRAILS_TOOL);
    const lines = ['The Sigrid MCP server is available - use it instead of guessing what Sigrid measured:'];

    if (queryTools.length > 0) {
        lines.push(`- confirm each finding above against Sigrid with ${queryTools.map(reference).join(' and ')}`);
    }
    if (tools.includes(GUARDRAILS_TOOL)) {
        lines.push(`- after editing, run ${reference(GUARDRAILS_TOOL)} on the changed files and iterate until it passes`);
    }
    lines.push('Do not change the status of any finding in Sigrid.');

    return lines.join('\n');
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
    return ['Findings (from Sigrid - fix these, do not go looking for others):', ...lines].join('\n');
}

function formatFinding(finding: FixFinding, position: number): string {
    const header = `${position}. ${finding.category} / ${finding.severity} - ${finding.title}`;
    const locations = (finding.fileLocations ?? []).map(formatLocation).filter(location => location.length > 0);
    return locations.length > 0 ? `${header}\n   Locations: ${locations.join(', ')}` : header;
}
