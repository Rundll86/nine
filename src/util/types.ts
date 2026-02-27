export type EmptyValue = undefined | null | void | never;
export type Normalize<T extends Record<string, unknown>> = T extends Record<infer K, infer R> ? Record<K, Required<R>> : never;
export type Valueof<T> = T[keyof T];
export type KebabToCamel<S extends string> =
    S extends `${infer First}-${infer Rest}`
    ? `${First}${Capitalize<KebabToCamel<Rest>>}`
    : S;
export type ObjectToEntryUnion<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

export function defineTemplate<T = void>(): T {
    return null as T;
}