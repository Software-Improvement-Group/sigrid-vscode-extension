import {Configuration} from '../models/configuration';
import {joinUrl} from './join-url';

/**
 * Placeholder "open in Sigrid" target for architecture findings, until Sigrid offers a URL per finding.
 * Returns an empty string when the configuration is not complete enough to build a link.
 */
export function buildArchitectureExplorerUrl({sigridUrl, customer, system}: Configuration): string {
  if (!sigridUrl || !customer || !system) {
    return '';
  }

  return joinUrl(sigridUrl, encodeURIComponent(customer), encodeURIComponent(system), '-', 'architecture-quality', 'explorer');
}
