export function snakeCaseToTitleCase(str: string): string {
  return str.replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function snakeCaseToSentenceCase(str: string): string {
  let result = str.replace(/_/g, ' ');
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function pascalCaseToTitleCase(input: string): string {
  if (!input) return '';

  return input
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function asStringOrDefault(value: any, defaultValue: string = 'N/A'): string {
  return value != null && value !== '' ? String(value) : defaultValue;
}
