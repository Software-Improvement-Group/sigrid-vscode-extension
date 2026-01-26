import {SecurityFinding, SecurityFindingResponse} from '../models/security-finding';
import {toRiskSeverity} from '../models/risk-severity';

export class SecurityFindingMapper {
  static map(findingsResponse: SecurityFindingResponse[]): SecurityFinding[] {
    return findingsResponse.map((response) => {
      const finding = new SecurityFinding();
      finding.id = response.id;
      finding.href = response.href;
      finding.severity = toRiskSeverity(response.severity);

      return finding;
    });
  }
}
