import {OpenSourceHealthDependency, OpenSourceHealthResponse} from '../models/open-source-health-dependency';
import {asStringOrDefault, snakeCaseToTitleCase} from '../utilities/string';
import {asRecord} from '../utilities/as-record';
import {RiskSeverity, toRiskSeverity} from '../models/risk-severity';
import {findMaxValue} from '../utilities/find-max-value';

export class OpenSourceHealthMapper {
  private static readonly dependencyTypeKey = 'sigrid:transitive';
  private static readonly vulnerabilityRiskKey = 'sigrid:risk:vulnerability';
  private static readonly licenseRiskKey = 'sigrid:risk:legal';
  private static readonly freshnessRiskKey = 'sigrid:risk:freshness';
  private static readonly activityRiskKey = 'sigrid:risk:activity';
  private static readonly stabilityRiskKey = 'sigrid:risk:stability';
  private static readonly managementRiskKey = 'sigrid:risk:management';

  static map(response: OpenSourceHealthResponse): OpenSourceHealthDependency[] {
    if (Array.isArray(response.components)) {
      return response.components.map(component => {
        const properties = asRecord(component.properties);

        const oshDependency = new OpenSourceHealthDependency();
        oshDependency.name = component.name;
        oshDependency.displayName = !!component.group ? `${component.group}/${component.name}` : component.name;
        oshDependency.version = asStringOrDefault(component.version);
        oshDependency.group = component.group;
        oshDependency.dependencyType = snakeCaseToTitleCase(properties[OpenSourceHealthMapper.dependencyTypeKey]);
        oshDependency.purl = component.purl;
        oshDependency.licenseRisk = toRiskSeverity(properties[OpenSourceHealthMapper.licenseRiskKey]);
        oshDependency.vulnerabilityRisk = toRiskSeverity(properties[OpenSourceHealthMapper.vulnerabilityRiskKey]);
        oshDependency.freshnessRisk = toRiskSeverity(properties[OpenSourceHealthMapper.freshnessRiskKey]);
        oshDependency.activityRisk = toRiskSeverity(properties[OpenSourceHealthMapper.activityRiskKey]);
        oshDependency.stabilityRisk = toRiskSeverity(properties[OpenSourceHealthMapper.stabilityRiskKey]);
        oshDependency.managementRisk = toRiskSeverity(properties[OpenSourceHealthMapper.managementRiskKey]);
        oshDependency.risk = findMaxValue(oshDependency.licenseRisk, oshDependency.vulnerabilityRisk, oshDependency.freshnessRisk, oshDependency.activityRisk, oshDependency.stabilityRisk, oshDependency.managementRisk) ?? RiskSeverity.Unknown;

        return oshDependency;
      }).sort((a, b) => {
        if (b.risk > a.risk) return 1;
        if (b.risk < a.risk) return -1;
        return a.displayName.localeCompare(b.displayName);
      });
    }

    return [];
  }
}
