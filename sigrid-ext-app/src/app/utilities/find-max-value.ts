export function findMaxValue(...values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((max, value) => Math.max(max, value), values[0]);
}
