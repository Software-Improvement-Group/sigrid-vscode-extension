import {Property} from '../models/property';

export function asRecord(properties: Property[]) {
  return properties.reduce((record, property) => {
    record[property.name] = property.value;
    return record;
  }, {} as Record<string, string>);
}
