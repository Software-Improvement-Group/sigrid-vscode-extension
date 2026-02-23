import {FileLocation} from '../models/file-location';
import {getFileName} from './path';

export function sortFileLocations(locations: FileLocation[]) {
  return locations.sort((a, b) => {
    const nameCompare = getFileName(a.filePath).localeCompare(getFileName(b.filePath));
    if (nameCompare !== 0) return nameCompare;

    const pathCompare = a.filePath.localeCompare(b.filePath);
    if (pathCompare !== 0) return pathCompare;

    return (a.startLine ?? 0) - (b.startLine ?? 0);
  });
}
