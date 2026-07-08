import {FindingSelection} from '../services/finding-selection';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {IssueFinding} from '../models/issue-finding';
import {getSeverityEmoji} from './severity-emoji';
import {SIGRID_DEFAULT_URL} from './constants';

export function buildIssuePayloadBase(selectionService: FindingSelection, sigridConfig: SigridConfiguration): {
  findings: IssueFinding[];
  sigridUrl: string;
} {
  const config = sigridConfig.getConfigurationOrEmpty();
  const sigridUrl = config.sigridUrl || SIGRID_DEFAULT_URL;
  const systemUrl = `${sigridUrl}/${config.customer}/${config.system}`;

  const findings: IssueFinding[] = selectionService.getAll().map(f => ({
    emoji: getSeverityEmoji(f.severity),
    title: f.title,
    fileLocations: f.fileLocations.map(loc => ({
      filePath: loc.filePath,
      startLine: loc.startLine,
    })),
  }));

  return {findings, sigridUrl: systemUrl};
}
