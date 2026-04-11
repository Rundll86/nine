import { matchFlag, WRAPPER } from "@/constants";
import { defineWatcher } from "../base";
import { duplicateObject } from "@/util/clone";

export default defineWatcher({
    validate(data: unknown): data is Record<PropertyKey, unknown> {
        return typeof data === "object" && data !== null && !Array.isArray(data);
    },
    duplicate: e => duplicateObject(e, e => matchFlag(e, WRAPPER) ? false : true),
    patch(data, snapshot, update) {
        const { proxy, revoke } = Proxy.revocable(data, {
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
            deleteProperty(target, p) {
                if (Reflect.has(target, p)) {
                    snapshot(target);
                    const result = Reflect.deleteProperty(target, p);
                    update(target);
                    return result;
                }
                return Reflect.deleteProperty(target, p);
            },
            defineProperty(target, p, attributes) {
                const oldDescriptor = Reflect.getOwnPropertyDescriptor(target, p);
                const hasChange = !oldDescriptor
                    || ("value" in attributes && oldDescriptor.value !== attributes.value)
                    || ("get" in attributes && oldDescriptor.get !== attributes.get)
                    || ("set" in attributes && oldDescriptor.set !== attributes.set)
                    || ("enumerable" in attributes && oldDescriptor.enumerable !== attributes.enumerable)
                    || ("configurable" in attributes && oldDescriptor.configurable !== attributes.configurable)
                    || ("writable" in attributes && oldDescriptor.writable !== attributes.writable);
                if (hasChange) {
                    snapshot(target);
                    const result = Reflect.defineProperty(target, p, attributes);
                    update(target);
                    return result;
                }
                return Reflect.defineProperty(target, p, attributes);
            }
        });
        return { data: proxy, revoke };
    },
});
