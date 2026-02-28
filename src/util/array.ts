import { PutIntoIterable } from "./types";

export function typedIsArray<T>(arr: unknown[]): arr is T[] {
    return Array.isArray(arr);
}
export function putIntoArray<T>(data: T): PutIntoIterable<T> {
    return [...(Array.isArray(data) ? data : [data])] as PutIntoIterable<T>;
}
export function createArray<T>(length: number, filler: () => T): T[] {
    return new Array(Math.max(length, 0)).fill(0).map(filler);
}