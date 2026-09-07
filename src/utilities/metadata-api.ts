import * as vscode from 'vscode';

export interface SystemMetadata {
  general: Record<string, string>;
  status: Record<string, string | boolean>;
  externalReference: Record<string, string>;
  metadata: Record<string, string>;
}

interface ApiMetadataResponse {
  [key: string]: unknown;
}

export async function fetchSystemMetadata(
  apiKey: string,
  sigridUrl: string,
  portfolio: string,
  system: string
): Promise<SystemMetadata> {
  // Use 'portfolio' parameter name (internally called customer in some APIs)
  const customer = portfolio;
  const url = `${sigridUrl}/rest/analysis-results/api/v1/system-metadata/${customer}/${system}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid API key');
      }
      if (response.status === 404) {
        throw new Error('Not Found: System or portfolio does not exist');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ApiMetadataResponse;
    return parseMetadataResponse(data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Metadata API did not respond within 10 seconds');
      }
      throw error;
    }
    throw new Error('Unknown error fetching metadata');
  } finally {
    clearTimeout(timeout);
  }
}

function parseMetadataResponse(data: ApiMetadataResponse): SystemMetadata {
  return {
    general: extractStringSection(data, ['systemName', 'displayName', 'division', 'team', 'supplier']),
    status: extractMixedSection(data, ['isActive', 'excludedFromDashboards', 'lastAssessmentDate']),
    externalReference: extractStringSection(data, ['externalId', 'externalDisplayName']),
    metadata: extractStringSection(data, [
      'inProductionSince',
      'businessCriticality',
      'lifecyclePhase',
      'targetIndustry',
      'deploymentType',
      'applicationType',
      'distributionStrategy',
    ]),
  };
}

function extractStringSection(data: ApiMetadataResponse, keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      result[key] = formatStringValue(value);
    }
  }

  return result;
}

function extractMixedSection(
  data: ApiMetadataResponse,
  keys: string[]
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      result[key] = formatValue(value);
    }
  }

  return result;
}

function formatStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return String(value ?? '');
}

function formatValue(value: unknown): string | boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return formatStringValue(value);
}

export function validateConfiguration(
  apiKey: string | undefined,
  portfolio: string | undefined,
  system: string | undefined
): { valid: boolean; message?: string } {
  if (!apiKey) {
    return { valid: false, message: 'API key not configured' };
  }
  if (!portfolio) {
    return { valid: false, message: 'Portfolio name not configured' };
  }
  if (!system) {
    return { valid: false, message: 'System name not configured' };
  }
  return { valid: true };
}
