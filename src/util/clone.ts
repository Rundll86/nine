export function duplicateObject<T>(target: T, hash = new WeakMap()): T {
    if (target === null || typeof target !== "object") {
        return target;
    }
    if (hash.has(target)) {
        return hash.get(target);
    }
    if (target instanceof Date) {
        return new Date(target) as T;
    }
    if (target instanceof RegExp) {
        return new RegExp(target) as T;
    }
    if (target instanceof Map) {
        const cloneMap = new Map();
        hash.set(target, cloneMap);
        target.forEach((value, key) => {
            cloneMap.set(duplicateObject(key, hash), duplicateObject(value, hash));
        });
        return cloneMap as T;
    }
    if (target instanceof Set) {
        const cloneSet = new Set();
        hash.set(target, cloneSet);
        target.forEach(value => {
            cloneSet.add(duplicateObject(value, hash));
        });
        return cloneSet as T;
    }
    const cloneObj = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
    hash.set(target, cloneObj);
    Reflect.ownKeys(target).forEach(key => {
        cloneObj[key] = duplicateObject(target[key as keyof T], hash);
    });
    if (typeof target === "function") {
        return target;
    }
    return cloneObj;
}