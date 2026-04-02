import {FindingLocation} from '../models/finding-location';
import {SigridFinding} from '../models/sigrid-finding';
import {FindingLocationFilter} from '../models/finding-location-filter';
import {FileFilterMode} from '../models/file-filter-mode';
import {FileLocation} from '../models/file-location';

export function filterFindings(
  sigridFindings: SigridFinding<FindingLocation[]> | null,
  filter: FindingLocationFilter
): SigridFinding<FindingLocation[]> | null {
  if (!sigridFindings?.data) {
    return sigridFindings;
  }

  const { fileFilterMode, component } = filter;

  if (fileFilterMode === FileFilterMode.All && !component) {
    return sigridFindings;
  }

  return {
    data: sigridFindings.data.filter(finding =>
      finding.fileLocations.some(matchesFileLocation(filter))
    ),
    date: sigridFindings.date,
    error: sigridFindings.error
  };
}

const matchesFileLocation = (filter: FindingLocationFilter) =>
  (location: FileLocation): boolean => {
    const { fileFilterMode, path, component } = filter;

    if (fileFilterMode === FileFilterMode.All) {
      return location.component === component;
    }

    if (path && !component) {
      return location.filePath === path;
    }

    return location.component === component && location.filePath === path;
  };
