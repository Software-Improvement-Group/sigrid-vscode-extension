import {RiskSeverity} from './risk-severity';
import {MaintainabilitySeverity} from './maintainability-severity';
import {FileLocation} from './file-location';

export interface SelectedFinding {
  id: string;
  category: string;
  title: string;
  severity: string | RiskSeverity | MaintainabilitySeverity;
  fileLocations: FileLocation[];
}
