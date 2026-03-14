import * as Nine9 from "@/index";

type Lib = typeof Nine9;
declare global {
    interface ObjectConstructor {
        entries<K, V>(data: Record<K, V>): [K, V][];
        hasOwn<T, K>(data: T, key: K): data is T & Record<K, unknown>;
    }
    interface Window {
        __ENV_9__?: Partial<{
            mode: "development" | "production"
        }>;
        nine9: Lib;
        nine: Lib;
        $$$$$$$$$: Lib;
        _________: Lib;
        $_$_$_$_$: Lib;
        _$_$_$_$_: Lib;
        $9: Lib;
    }
}
export { };