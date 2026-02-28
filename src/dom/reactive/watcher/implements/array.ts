import { defineWatcher } from "../base";

const arrayModifiableActions = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
export default defineWatcher({
    validate: Array.isArray,
    duplicate: x => [...x],
    patch(data, snapshot, update) {
        const { proxy, revoke } = Proxy.revocable(data, {
            get(target, p: string, receiver) {
                if (arrayModifiableActions.includes(p)) {
                    const originalMethod = Reflect.get(target, p, receiver) as (...args: unknown[]) => unknown;
                    if (typeof originalMethod === "function") {
                        return (...args: unknown[]) => {
                            snapshot(target);
                            const result = originalMethod.call(target, ...args);
                            update(target);
                            return result;
                        };
                    } else return Reflect.get(target, p, receiver);
                } else {
                    return Reflect.get(target, p, receiver);
                }
            },
            set(target, p, newValue, receiver) {
                const oldValue = Reflect.get(target, p, receiver);
                if (oldValue !== newValue) {
                    snapshot(target);
                    const result = Reflect.set(target, p, newValue, receiver);
                    update(target);
                    return result;
                }
                return Reflect.set(target, p, newValue, receiver);
            },
        });
        return { data: proxy, revoke };
    },
});