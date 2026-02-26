import { ComponentInstance, HostTree, Wrapper } from "@/dom";

type FlagMap<T> =
    { [K in typeof HOST_TREE]: HostTree; }
    & { [K in typeof COMPONENT_INSTANCE]: ComponentInstance; }
    & { [K in typeof WRAPPER]: Wrapper<T>; }

export const HOST_TREE = Symbol("HostTreeFlag");
export const COMPONENT_INSTANCE = Symbol("ComponentInstanceFlag");
export const WRAPPER = Symbol("WrapperFlag");

export function appendFlag<T extends object, F extends keyof FlagMap<unknown>>(data: T, flag: F) {
    return Object.assign(data, { [flag]: true }) as T & { [K in F]: true };
}
export function matchFlag<T, K extends keyof FlagMap<T> = keyof FlagMap<T>>(data: unknown, flag: K): data is FlagMap<T>[K] {
    return (
        (data !== null && data !== undefined)
        && typeof data === "object"
        && Object.hasOwn(data, flag)
        && data[flag] === true
    );
}