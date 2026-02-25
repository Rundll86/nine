import { EventSubcriber } from "@/channel/event-subcriber";
import { TreeResult } from "./component";

export const wrapperSymbol = Symbol("WrapperFlag");
export type Wrapper<T> = {
    get(): T;
    set(newData: T): void;
    emitEvent(newData: T, oldData: T): void;
    updateOnly(): void;
    event: EventSubcriber<[T, T]>;
} & { [K in typeof wrapperSymbol]: true; };
export function wrap<T>(initialData: T): Wrapper<T> {
    const arrayActions = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
    const patch = (data: T) => {
        if (!Array.isArray(data)) { return data; }
        const { proxy, revoke: newRevoke } = Proxy.revocable(data, {
            get(target, p: string, receiver) {
                if (arrayActions.includes(p)) {
                    const originalMethod = Reflect.get(target, p, receiver) as (...args: unknown[]) => unknown;
                    if (typeof originalMethod === "function") {
                        return (...args: unknown[]) => {
                            let oldData = wrapper.get();
                            if (Array.isArray(oldData)) {
                                oldData = [...oldData] as T;
                                const result = originalMethod.call(target, ...args);
                                wrapper.emitEvent(wrapper.get(), oldData);
                                return result;
                            }
                        };
                    } else return Reflect.get(target, p, receiver);
                } else {
                    return Reflect.get(target, p, receiver);
                }
            },
            set(target, p, newValue, receiver) {
                const oldValue = Reflect.get(target, p, receiver);
                if (oldValue !== newValue) {
                    let oldData = wrapper.get();
                    if (Array.isArray(oldData)) {
                        oldData = [...oldData] as T;
                        const result = Reflect.set(target, p, newValue, receiver);
                        wrapper.emitEvent(wrapper.get(), oldData);
                        return result;
                    }
                }
                return Reflect.set(target, p, newValue, receiver);
            },
        });
        oldRevoke = newRevoke;
        return proxy;
    };
    const event = new EventSubcriber<[T, T]>();
    let oldRevoke: (() => void) | null = null;
    let currentData = patch(initialData);
    const wrapper: Wrapper<T> = {
        get() { return currentData; },
        set(newData) {
            if (currentData !== newData) {
                const oldData = currentData;
                if (Array.isArray(oldData) && oldRevoke) {
                    oldRevoke();
                    currentData = patch(newData);
                } else {
                    currentData = newData;
                };
                this.emitEvent(newData, oldData);
            }
        },
        emitEvent(newData, oldData) {
            event.emit(newData, oldData);
        },
        updateOnly() {
            this.emitEvent(this.get(), this.get());
        },
        event,
        [wrapperSymbol]: true
    };
    return wrapper;
}
export function sync<R>(effectRenderer: () => R, dependencies: unknown[] = []): Wrapper<R> {
    const internalWrapper = wrap(effectRenderer());
    const update = () => {
        const newData = effectRenderer();
        const currentData = internalWrapper.get();
        const hasChanged = currentData !== newData;
        if (hasChanged) {
            internalWrapper.set(newData);
        }
    };
    for (const dependency of dependencies) {
        if (!isWrapper(dependency)) continue;
        dependency.event.subcribe(update);
    }
    return internalWrapper;
}
export function when(condition: Wrapper<boolean> | (() => boolean), tree: TreeResult, dependencies: unknown[] = []) {
    return sync(() => {
        let result: boolean;
        if (typeof condition === "function") {
            result = condition();
        } else {
            result = condition.get();
        }
        return [result ? tree : null];
    }, dependencies);
}
export function isWrapper<T>(data: unknown): data is Wrapper<T> {
    return Object.hasOwn(data, wrapperSymbol) && data[wrapperSymbol] === true;
}
