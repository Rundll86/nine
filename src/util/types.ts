export type EmptyValue = undefined | null | void | never;
export type Normalize<T extends Record<string, unknown>> = T extends Record<infer K, infer R> ? Record<K, Required<R>> : never;
export type Valueof<T> = T[keyof T];