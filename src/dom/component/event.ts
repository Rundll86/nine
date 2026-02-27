export type EventDescriptor<T = unknown, N extends string = string> = {
    name: N;
} & EventOptions<T>;
export interface EventOptions<T> {
    bubbleable?: boolean;
    template?: T;
}

export function defineEvent<T, N extends string>(name: N, options?: EventOptions<T>): EventDescriptor<T, N> {
    return { name, ...options ?? {} };
}