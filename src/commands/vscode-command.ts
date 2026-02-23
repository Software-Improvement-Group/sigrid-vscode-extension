export interface VsCodeCommand<T> {
    execute(payload?: T): void;
}
