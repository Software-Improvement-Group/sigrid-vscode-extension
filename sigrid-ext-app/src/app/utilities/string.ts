export function snakeCaseToTitleCase(str: string): string {
  return str.replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function asStringOrDefault(value: any, defaultValue: string = 'N/A'): string {
  return value != null && value !== '' ? String(value) : defaultValue;
}
