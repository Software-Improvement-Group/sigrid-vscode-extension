import {FindingLocation} from '../models/finding-location';
import {SigridFinding} from '../models/sigrid-finding';

export function filterFindingsByPath(sigridFindings: SigridFinding<FindingLocation[]> | null, path: string) {
  if (!sigridFindings || !sigridFindings.data) {
    return sigridFindings;
  }

  const resultFindings: SigridFinding<FindingLocation[]> = {
    data: [],
    date: sigridFindings.date,
    error: sigridFindings.error
  }

  if (path) {
    resultFindings.data = sigridFindings.data.filter(finding => finding.fileLocations.some(location => location.filePath === path));
  }

  return resultFindings;
}
