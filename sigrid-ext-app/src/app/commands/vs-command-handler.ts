export interface VsCommandHandler<T> {
  execute(payload: T): void;
}
