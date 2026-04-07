import {FileFilterMode} from './file-filter-mode';

export interface FindingLocationFilter {
  fileFilterMode: FileFilterMode;
  path: string;
  component: string;
}
