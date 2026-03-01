import { Wrapper } from "../wrapper";

export interface RevokeOldDataMethod<T> {
    (oldState: T): void;
}
export interface ValidateMethod<T> {
    (data: unknown): data is T
}
export interface StructWatcher<T> {
    validate: ValidateMethod<T>;
    duplicate(data: T): T;
    patch(
        data: T,
        snapshot: (currentState: T) => T,
        update: (newState: T) => void,
        wrapper: Wrapper<T>
    ): { data: T; revoke: RevokeOldDataMethod<T> };
}

export function defineWatcher<T>(watcher: StructWatcher<T>) {
    return watcher;
}