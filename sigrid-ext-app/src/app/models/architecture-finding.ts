import {RiskSeverity} from './risk-severity';
import {FileLocation} from './file-location';
import {FindingLocation} from './finding-location';

export interface ArchitectureElementResponse {
  id: string;
  type: string;
  name?: string;
  shortName?: string;
}

export interface ArchitectureDependencyResponse {
  id?: string;
  type: string;
  sourceElementId: string;
  targetElementId: string;
  qualification?: string;
  qualifications?: string[];
  lines?: number[][];
}

/** The part of the raw architecture graph (`architecture-quality/.../raw`) that findings are derived from. */
export interface ArchitectureGraphResponse {
  systemElements?: ArchitectureElementResponse[];
  dependencies?: ArchitectureDependencyResponse[];
}

/** Lookup tables over the raw graph, so each dependency can be resolved without scanning it. */
export interface GraphIndex {
  files: Map<string, ArchitectureElementResponse>;
  components: Map<string, ArchitectureElementResponse>;
  parentIds: Map<string, string>;
}

/** The elements a dependency connects: its source file and the components of both files. */
export interface DependencyLink {
  sourceFile: ArchitectureElementResponse;
  source: ArchitectureElementResponse;
  target: ArchitectureElementResponse;
}

export interface QualificationRule {
  severity: RiskSeverity;
  describe: (source: string, target: string) => string;
}

export class ArchitectureFinding implements FindingLocation {
  id: string = '';
  severity: RiskSeverity = RiskSeverity.Unknown;
  description: string = '';
  sourceComponent: string = '';
  targetComponent: string = '';
  filePath: string = '';
  displayFilePath: string = '';
  line: number = 0;
  fileLocations: FileLocation[] = [];
}
