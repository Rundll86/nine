export function typedIsArray<T>(arr: unknown[]): arr is T[] {
    return Array.isArray(arr);
}
export function putIn<T>(data: T) {
    return [...(Array.isArray(data) ? data : [data])] as T extends (infer R)[] ? R[] : [T];
}
export function createArray<T>(length: number, filler: () => T): T[] {
    return new Array(length).fill(0).map(filler);
}