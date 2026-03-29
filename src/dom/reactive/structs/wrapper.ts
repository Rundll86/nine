import { EventSubcriber } from "@/channel";

export interface Readable<T> {
    get(): T;
}
export interface Writable<T> {
    set(data: T): void;
}
export interface Updatable<T> {
    event: EventSubcriber<[T, T]>;
    updateOnly(): void;
}