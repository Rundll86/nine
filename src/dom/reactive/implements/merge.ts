export function merge<T>(...objects: T[]) {
    const prioritied = objects.toReversed();
    return new Proxy({}, {
        get(_, p, receiver) {
            for (const object of prioritied) {
                if (Object.hasOwn(object, p)) {
                    return Reflect.get(object, p, receiver);
                }
            }
        },
        set(_, p, newValue, receiver) {
            for (const object of prioritied) {
                if (Object.hasOwn(object, p)) {
                    return Reflect.set(object, p, newValue, receiver);
                }
            }
            return false;
        },
    }) as { [K in keyof T]: T[K] };
}