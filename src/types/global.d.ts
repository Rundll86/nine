declare global {
    interface ObjectConstructor {
        entries<K, V>(data: Record<K, V>): [K, V][];
        hasOwn<T, K>(data: T, key: K): data is T & Record<K, unknown>;
    }
}
export { };