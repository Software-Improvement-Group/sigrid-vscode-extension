import {FileLocation} from './file-location';

export interface SelectedFinding {
  id: string;
  category: string;
  title: string;
  severity: string;
  fileLocations: FileLocation[];
}
