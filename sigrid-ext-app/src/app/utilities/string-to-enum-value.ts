/**
 * Generic function to convert a string to a given enum type.
 * @param enumObj The enum object.
 * @param value The string value to convert.
 * @returns The enum value or undefined if not found.
 */
export function stringToEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: string
): T[keyof T] | undefined {
  // Check if the value exists in the enum values
  const enumValues = Object.values(enumObj) as Array<string | number>;
  if (enumValues.includes(value)) {
    return value as T[keyof T];
  }

  // For numeric enums, try parsing numbers
  const numValue = Number(value);
  if (!isNaN(numValue) && enumValues.includes(numValue)) {
    return numValue as T[keyof T];
  }

  return undefined; // Not found
}
