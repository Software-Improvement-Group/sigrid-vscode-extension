import {SecurityFinding, SecurityFindingResponse} from '../models/security-finding';
import {toRiskSeverity} from '../models/risk-severity';
import {toDisplayFilePath} from '../utilities/path';
import {snakeCaseToTitleCase} from '../utilities/string';

export class SecurityFindingMapper {
  static map(findingsResponse: SecurityFindingResponse[]): SecurityFinding[] {
    return findingsResponse.map((response) => {
      const finding = new SecurityFinding();
      finding.id = response.id;
      finding.href = response.href;
      finding.severity = toRiskSeverity(response.severity);
      finding.filePath = response.filePath ?? '';
      finding.displayFilePath = toDisplayFilePath(response.filePath);
      finding.type = response.type;
      finding.status = snakeCaseToTitleCase(response.status);

      return finding;
    }).sort((a, b) => {
      if (b.severity > a.severity) return 1;
      if (b.severity < a.severity) return -1;
      return a.displayFilePath.localeCompare(b.filePath);
    });
  }
}
