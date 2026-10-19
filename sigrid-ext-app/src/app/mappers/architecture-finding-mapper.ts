import {
  ArchitectureDependencyResponse,
  ArchitectureElementResponse,
  ArchitectureFinding,
  ArchitectureGraphResponse,
  DependencyLink,
  GraphIndex,
  QualificationRule
} from '../models/architecture-finding';
import {RiskSeverity} from '../models/risk-severity';
import {normalizePath, toDisplayFilePath} from '../utilities/path';

/** Order matters: a dependency that is both undesirable and cyclic is reported as undesirable. */
const QUALIFICATION_RULES: [string, QualificationRule][] = [
  ['UNDESIRABLE', {
    severity: RiskSeverity.High,
    describe: (source, target) => `Undesirable dependency from ${source} to ${target}.`,
  }],
  ['CYCLIC', {
    severity: RiskSeverity.Medium,
    describe: (source, target) => `Cyclic dependency between ${source} and ${target}.`,
  }],
];

const CALL_DEPENDENCY_TYPES = ['CODE_CALL', 'DATA_ACCESS', 'INTERFACE_CALL'];

/**
 * Derives architecture findings from the raw architecture graph: every call dependency between two
 * files that Sigrid qualified as undesirable or cyclic, expressed on the level of their components.
 */
export class ArchitectureFindingMapper {
  static map(response: ArchitectureGraphResponse, subsystem: string): ArchitectureFinding[] {
    if (!Array.isArray(response?.systemElements) || !Array.isArray(response?.dependencies)) {
      return [];
    }

    const index = ArchitectureFindingMapper.buildIndex(response.systemElements, response.dependencies);

    return response.dependencies
      .filter(dependency => CALL_DEPENDENCY_TYPES.includes(dependency.type))
      .map(dependency => ArchitectureFindingMapper.createFinding(dependency, index, subsystem))
      .filter((finding): finding is ArchitectureFinding => !!finding)
      .filter(finding => !subsystem || finding.sourceComponent === subsystem)
      .sort(ArchitectureFindingMapper.compare);
  }

  private static buildIndex(elements: ArchitectureElementResponse[], dependencies: ArchitectureDependencyResponse[]): GraphIndex {
    return {
      files: ArchitectureFindingMapper.indexByType(elements, 'FILE'),
      components: ArchitectureFindingMapper.indexByType(elements, 'CODE_COMPONENT'),
      parentIds: ArchitectureFindingMapper.indexParentIds(dependencies),
    };
  }

  private static indexByType(elements: ArchitectureElementResponse[], type: string) {
    return new Map(elements.filter(element => element.type === type).map(element => [element.id, element]));
  }

  private static indexParentIds(dependencies: ArchitectureDependencyResponse[]) {
    return new Map(dependencies
      .filter(dependency => dependency.type === 'CONTAINS')
      .map(dependency => [dependency.targetElementId, dependency.sourceElementId]));
  }

  private static createFinding(dependency: ArchitectureDependencyResponse, index: GraphIndex, subsystem: string) {
    const rule = ArchitectureFindingMapper.findRule(dependency);
    const link = ArchitectureFindingMapper.resolveLink(dependency, index);

    return rule && link ? ArchitectureFindingMapper.buildFinding(dependency, rule, link, subsystem) : undefined;
  }

  private static resolveLink(dependency: ArchitectureDependencyResponse, index: GraphIndex): DependencyLink | undefined {
    const sourceFile = index.files.get(dependency.sourceElementId);
    const source = ArchitectureFindingMapper.componentOf(dependency.sourceElementId, index);
    const target = ArchitectureFindingMapper.componentOf(dependency.targetElementId, index);

    return sourceFile && index.files.has(dependency.targetElementId) && source && target
      ? {sourceFile, source, target}
      : undefined;
  }

  private static componentOf(fileId: string, index: GraphIndex) {
    return index.components.get(index.parentIds.get(fileId) ?? '');
  }

  private static buildFinding(
    dependency: ArchitectureDependencyResponse,
    rule: QualificationRule,
    link: DependencyLink,
    subsystem: string,
  ): ArchitectureFinding {
    const sourceName = ArchitectureFindingMapper.displayName(link.source);
    const targetName = ArchitectureFindingMapper.displayName(link.target);
    const finding = new ArchitectureFinding();
    finding.id = dependency.id ?? `${dependency.sourceElementId}->${dependency.targetElementId}`;
    finding.severity = rule.severity;
    finding.description = rule.describe(sourceName, targetName);
    finding.sourceComponent = sourceName;
    finding.targetComponent = targetName;
    ArchitectureFindingMapper.assignLocation(finding, link.sourceFile, dependency, subsystem);

    return finding;
  }

  private static assignLocation(
    finding: ArchitectureFinding,
    file: ArchitectureElementResponse,
    dependency: ArchitectureDependencyResponse,
    subsystem: string,
  ) {
    finding.line = dependency.lines?.[0]?.[0] ?? 0;
    finding.filePath = normalizePath(file.name ?? file.shortName, subsystem);
    finding.displayFilePath = toDisplayFilePath(finding.filePath);
    finding.fileLocations = [{
      component: finding.sourceComponent,
      filePath: finding.filePath,
      startLine: finding.line,
      endLine: finding.line,
    }];
  }

  /** Sigrid writes the qualification as a list in the graph export and as a single value in its docs. */
  private static findRule(dependency: ArchitectureDependencyResponse): QualificationRule | undefined {
    const qualifications = [...(dependency.qualifications ?? []), dependency.qualification];
    return QUALIFICATION_RULES.find(([name]) => qualifications.includes(name))?.[1];
  }

  private static displayName(element: ArchitectureElementResponse): string {
    return element.shortName ?? element.name ?? element.id;
  }

  private static compare(a: ArchitectureFinding, b: ArchitectureFinding): number {
    return b.severity - a.severity || a.description.localeCompare(b.description);
  }
}
