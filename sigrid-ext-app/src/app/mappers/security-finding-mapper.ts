import {SecurityFinding, SecurityFindingResponse} from '../models/security-finding';
import {toRiskSeverity} from '../models/risk-severity';
import {normalizePath, toDisplayFilePath} from '../utilities/path';
import {snakeCaseToTitleCase} from '../utilities/string';
import {FindingStatus} from '../models/finding-status';
import {stringToEnumValue} from '../utilities/string-to-enum-value';

export class SecurityFindingMapper {
  static map(findingsResponse: SecurityFindingResponse[], subsystem: string): SecurityFinding[] {
    if (!Array.isArray(findingsResponse)) {
      return [];
    }
    return findingsResponse
      .filter(response => !subsystem || response.component === subsystem)
      .map((response) => {
        const finding = new SecurityFinding();
        finding.id = response.id;
        finding.href = response.href;
        finding.severity = toRiskSeverity(response.severity);
        finding.filePath = response.filePath ?? '';
        finding.displayFilePath = toDisplayFilePath(response.filePath);
        finding.type = response.type;
        finding.status = stringToEnumValue(FindingStatus, response.status) ?? FindingStatus.Raw;
        finding.statusLabel = snakeCaseToTitleCase(response.status);
        finding.fileLocations = [{
          component: response.component,
          filePath: normalizePath(finding.filePath, subsystem),
          startLine: response.startLine ?? 0,
          endLine: response.endLine ?? 0
        }];

        return finding;
      }).sort((a, b) => {
        if (b.severity > a.severity) return 1;
        if (b.severity < a.severity) return -1;
        return a.displayFilePath.localeCompare(b.fileLocations[0]?.filePath ?? '');
      });
  }
}
