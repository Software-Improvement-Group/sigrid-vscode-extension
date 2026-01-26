export interface SigridFinding<T> {
  data: T | undefined;
  error: string | undefined;
  date: Date | undefined;
}
